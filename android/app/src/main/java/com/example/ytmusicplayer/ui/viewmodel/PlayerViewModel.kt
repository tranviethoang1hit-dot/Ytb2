package com.example.ytmusicplayer.ui.viewmodel

import android.app.Application
import android.content.Intent
import android.widget.Toast
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.example.ytmusicplayer.YouTubePlayerActivity
import com.example.ytmusicplayer.data.db.AppDatabase
import com.example.ytmusicplayer.data.model.*
import com.example.ytmusicplayer.data.repository.YouTubeRepository
import com.example.ytmusicplayer.service.PlayerController
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import java.io.File
import java.net.HttpURLConnection
import java.net.URL
import java.util.UUID

class PlayerViewModel(application: Application) : AndroidViewModel(application) {
    private val db = AppDatabase.getDatabase(application)
    private val favoriteDao = db.favoriteDao()
    private val historyDao = db.historyDao()
    private val playlistDao = db.playlistDao()
    private val offlineVideoDao = db.offlineVideoDao()
    private val repository = YouTubeRepository()
    private val playerController = PlayerController(application.applicationContext)
    private var sleepTimerJob: Job? = null

    val activeTab = MutableStateFlow(0)
    val selectedCategory = MutableStateFlow("trending")
    val searchQuery = MutableStateFlow("")
    val isSearching = MutableStateFlow(false)
    val displayedVideos = MutableStateFlow<List<VideoItem>>(emptyList())
    val categories = repository.categories

    val playerState: StateFlow<PlayerState> = playerController.state
    val queue: StateFlow<List<VideoItem>> = playerController.queue

    private val _sleepTimerSecondsLeft = MutableStateFlow<Int?>(null)
    val sleepTimerSecondsLeft: StateFlow<Int?> = _sleepTimerSecondsLeft.asStateFlow()

    val isFullPlayerOpen = MutableStateFlow(false)
    val isQueueDrawerOpen = MutableStateFlow(false)
    val isSleepTimerDialogOpen = MutableStateFlow(false)
    val isDirectUrlDialogOpen = MutableStateFlow(false)
    val isAdShieldDialogOpen = MutableStateFlow(false)
    val isPlaylistDialogOpen = MutableStateFlow(false)
    val isDownloadDialogOpen = MutableStateFlow(false)
    val selectedVideoForAction = MutableStateFlow<VideoItem?>(null)

    // This is intentionally zero: the previous project displayed fabricated
    // ad-block statistics. This app does not claim to block YouTube ads.
    val adBlockStats = MutableStateFlow(
        AdBlockStats(blockedCount = 0, timeSavedSeconds = 0, isAdBlockActive = false, adCurrentlyDetected = false)
    )

    val favorites: StateFlow<List<FavoriteEntity>> = favoriteDao.getAllFavorites()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val history: StateFlow<List<HistoryEntity>> = historyDao.getRecentHistory()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val playlists: StateFlow<List<PlaylistEntity>> = playlistDao.getAllPlaylists()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())
    val offlineVideos: StateFlow<List<OfflineVideoEntity>> = offlineVideoDao.getAllOfflineVideos()
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    init { loadCategoryVideos("trending") }

    fun selectCategory(categoryId: String) {
        selectedCategory.value = categoryId
        loadCategoryVideos(categoryId)
    }

    fun search(query: String) {
        searchQuery.value = query
        viewModelScope.launch {
            isSearching.value = true
            displayedVideos.value = repository.searchVideos(query, selectedCategory.value)
            isSearching.value = false
        }
    }

    private fun loadCategoryVideos(categoryId: String) {
        viewModelScope.launch {
            isSearching.value = true
            displayedVideos.value = repository.searchVideos("", categoryId)
            isSearching.value = false
        }
    }

    fun playVideo(video: VideoItem) {
        if (video.mediaUrl.isNullOrBlank()) {
            openYouTube(video)
            recordHistory(video)
            return
        }
        if (playerController.playSingle(video)) recordHistory(video)
    }

    fun playQueue(videos: List<VideoItem>, startIndex: Int = 0) {
        val playable = videos.filter { !it.mediaUrl.isNullOrBlank() }
        if (playable.isEmpty()) {
            videos.getOrNull(startIndex)?.let { playVideo(it) }
            return
        }
        if (playerController.playQueue(playable, startIndex.coerceIn(0, playable.lastIndex))) {
            playable.getOrNull(startIndex)?.let { recordHistory(it) }
        }
    }

    fun togglePlayPause() = playerController.togglePlayPause()
    fun playNext() = playerController.playNext()
    fun playPrevious() = playerController.playPrevious()
    fun seekTo(positionMs: Long) = playerController.seekTo(positionMs)
    fun setPlaybackSpeed(speed: Float) = playerController.setPlaybackSpeed(speed)
    fun cycleRepeatMode() = playerController.cycleRepeatMode()
    fun toggleShuffle() = playerController.toggleShuffle()

    fun setSleepTimer(minutes: Int) {
        cancelSleepTimer()
        if (minutes <= 0) return
        sleepTimerJob = viewModelScope.launch {
            var remaining = minutes * 60
            _sleepTimerSecondsLeft.value = remaining
            while (isActive && remaining > 0) {
                delay(1000)
                remaining--
                _sleepTimerSecondsLeft.value = remaining.takeIf { it > 0 }
            }
            if (remaining <= 0) {
                playerController.togglePlayPauseIfPlaying()
                _sleepTimerSecondsLeft.value = null
            }
        }
        isSleepTimerDialogOpen.value = false
    }

    fun cancelSleepTimer() {
        sleepTimerJob?.cancel()
        sleepTimerJob = null
        _sleepTimerSecondsLeft.value = null
    }

    fun toggleFavorite(video: VideoItem) {
        viewModelScope.launch {
            if (favoriteDao.isFavorite(video.id)) favoriteDao.deleteById(video.id)
            else favoriteDao.insertFavorite(
                FavoriteEntity(video.id, video.title, video.channelTitle, video.thumbnail, video.duration, video.views)
            )
        }
    }

    private fun recordHistory(video: VideoItem) {
        viewModelScope.launch {
            historyDao.insertHistory(
                HistoryEntity(video.id, video.title, video.channelTitle, video.thumbnail, video.duration, video.views)
            )
        }
    }

    fun clearHistory() = viewModelScope.launch { historyDao.clearAllHistory() }

    fun playDirectUrl(url: String) {
        val trimmed = url.trim()
        val youtubeId = repository.parseYouTubeUrl(trimmed)
        if (youtubeId != null) {
            val video = VideoItem(
                id = youtubeId,
                title = "YouTube: $youtubeId",
                channelTitle = "YouTube",
                thumbnail = "https://i.ytimg.com/vi/$youtubeId/hqdefault.jpg"
            )
            openYouTube(video)
            recordHistory(video)
            isDirectUrlDialogOpen.value = false
            return
        }

        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
            val video = VideoItem(
                id = "direct-${trimmed.hashCode()}",
                title = trimmed.substringAfterLast('/').substringBefore('?').ifBlank { "Direct audio" },
                channelTitle = "Direct media URL",
                thumbnail = "",
                mediaUrl = trimmed
            )
            if (playerController.playSingle(video)) {
                recordHistory(video)
                isDirectUrlDialogOpen.value = false
            }
        } else {
            toast("Link không hợp lệ")
        }
    }

    private fun openYouTube(video: VideoItem) {
        val intent = Intent(getApplication(), YouTubePlayerActivity::class.java).apply {
            putExtra(YouTubePlayerActivity.EXTRA_VIDEO_ID, video.id)
            putExtra(YouTubePlayerActivity.EXTRA_TITLE, video.title)
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        getApplication<Application>().startActivity(intent)
    }

    fun createPlaylist(name: String, description: String?) {
        viewModelScope.launch {
            playlistDao.insertPlaylist(PlaylistEntity(UUID.randomUUID().toString(), name, description, "[]"))
        }
    }

    fun addVideoToPlaylist(playlist: PlaylistEntity, video: VideoItem) {
        viewModelScope.launch {
            val type = object : TypeToken<MutableList<VideoItem>>() {}.type
            val list: MutableList<VideoItem> = try {
                Gson().fromJson<MutableList<VideoItem>>(playlist.videosJson, type) ?: mutableListOf()
            } catch (e: Exception) {
                mutableListOf()
            }
            if (list.none { it.id == video.id }) {
                list.add(video)
                playlistDao.insertPlaylist(playlist.copy(videosJson = Gson().toJson(list)))
            }
            isPlaylistDialogOpen.value = false
        }
    }

    /**
     * Downloads only a direct media URL supplied by the user/app backend.
     * A YouTube video ID by itself is not treated as a downloadable media URL.
     */
    fun startDownload(video: VideoItem, resolution: VideoResolutionId) {
        val mediaUrl = video.mediaUrl
        if (mediaUrl.isNullOrBlank()) {
            toast("Video YouTube cần phát bằng trình phát chính thức; không thể tải stream YouTube từ ID.")
            isDownloadDialogOpen.value = false
            return
        }
        viewModelScope.launch(Dispatchers.IO) {
            try {
                val extension = mediaUrl.substringAfterLast('/').substringBefore('?').substringAfterLast('.').takeIf { it.length in 2..5 } ?: "media"
                val file = File(getApplication<Application>().filesDir, "offline/${UUID.randomUUID()}.$extension")
                file.parentFile?.mkdirs()
                val connection = URL(mediaUrl).openConnection() as HttpURLConnection
                connection.connectTimeout = 15_000
                connection.readTimeout = 30_000
                connection.requestMethod = "GET"
                connection.connect()
                if (connection.responseCode !in 200..299) error("HTTP ${connection.responseCode}")
                connection.inputStream.use { input -> file.outputStream().use { output -> input.copyTo(output) } }
                connection.disconnect()
                val size = file.length()
                offlineVideoDao.insertOfflineVideo(
                    OfflineVideoEntity(
                        id = UUID.randomUUID().toString(), videoId = video.id, title = video.title,
                        channelTitle = video.channelTitle, thumbnail = video.thumbnail, duration = video.duration,
                        resolution = resolution.label, format = extension, localFilePath = file.absolutePath,
                        sizeBytes = size
                    )
                )
                viewModelScope.launch(Dispatchers.Main) {
                    isDownloadDialogOpen.value = false
                    toast("Đã tải ${file.name}")
                }
            } catch (e: Exception) {
                viewModelScope.launch(Dispatchers.Main) { toast("Tải thất bại: ${e.message ?: "lỗi mạng"}") }
            }
        }
    }

    fun playOffline(video: OfflineVideoEntity) {
        val file = File(video.localFilePath)
        if (!file.exists()) {
            toast("File ngoại tuyến không còn tồn tại")
            return
        }
        playVideo(
            VideoItem(video.videoId, video.title, video.channelTitle, video.thumbnail, video.duration, mediaUrl = file.toURI().toString())
        )
    }

    fun deleteOfflineVideo(video: OfflineVideoEntity) {
        viewModelScope.launch(Dispatchers.IO) {
            runCatching { File(video.localFilePath).delete() }
            offlineVideoDao.deleteOfflineVideo(video)
        }
    }

    private fun toast(message: String) {
        viewModelScope.launch(Dispatchers.Main) {
            Toast.makeText(getApplication(), message, Toast.LENGTH_LONG).show()
        }
    }

    override fun onCleared() {
        cancelSleepTimer()
        playerController.release()
        super.onCleared()
    }
}
