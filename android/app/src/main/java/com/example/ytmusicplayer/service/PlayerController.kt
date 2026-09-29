package com.example.ytmusicplayer.service

import android.content.ComponentName
import android.content.Context
import androidx.media3.common.MediaItem
import androidx.media3.common.PlaybackParameters
import androidx.media3.common.Player
import androidx.media3.session.MediaController
import androidx.media3.session.SessionToken
import com.example.ytmusicplayer.data.model.PlayerState
import com.example.ytmusicplayer.data.model.RepeatMode
import com.example.ytmusicplayer.data.model.VideoItem
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch

/** Thin UI-side adapter around the Media3 MediaController. */
class PlayerController(context: Context) {
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
    private val _state = MutableStateFlow(PlayerState())
    val state: StateFlow<PlayerState> = _state.asStateFlow()

    private val _queue = MutableStateFlow<List<VideoItem>>(emptyList())
    val queue: StateFlow<List<VideoItem>> = _queue.asStateFlow()

    private val videosById = linkedMapOf<String, VideoItem>()
    private var controller: MediaController? = null

    init {
        scope.launch {
            while (isActive) {
                refreshState()
                delay(500)
            }
        }
        val token = SessionToken(context, ComponentName(context, BackgroundAudioService::class.java))
        val controllerFuture = MediaController.Builder(context, token).buildAsync()
        controllerFuture.addListener({
            try {
                controller = controllerFuture.get()
                controller?.addListener(listener)
                refreshState()
            } catch (e: Exception) {
                // The UI remains usable; playback becomes available when the
                // service/controller can be created successfully.
            }
        }, { command -> command.run() })
    }

    private val listener = object : Player.Listener {
        override fun onEvents(player: Player, events: Player.Events) {
            refreshState()
        }
    }

    private fun refreshState() {
        val player = controller ?: return
        val currentId = player.currentMediaItem?.mediaId
        val video = currentId?.let { videosById[it] }
        _state.value = _state.value.copy(
            currentVideo = video,
            isPlaying = player.isPlaying,
            isBuffering = player.playbackState == Player.STATE_BUFFERING,
            currentPositionMs = player.currentPosition.coerceAtLeast(0L),
            durationMs = player.duration.takeIf { it >= 0 } ?: 0L,
            playbackSpeed = player.playbackParameters.speed,
            repeatMode = when (player.repeatMode) {
                Player.REPEAT_MODE_ONE -> RepeatMode.ONE
                Player.REPEAT_MODE_ALL -> RepeatMode.ALL
                else -> RepeatMode.NONE
            },
            isShuffle = player.shuffleModeEnabled
        )
    }

    fun playSingle(video: VideoItem): Boolean {
        val mediaUrl = video.mediaUrl ?: return false
        videosById[video.id] = video
        _queue.value = listOf(video)
        controller?.setMediaItem(
            BackgroundAudioService.mediaItemFor(
                video.id, video.title, video.channelTitle, video.thumbnail, mediaUrl
            )
        )
        controller?.prepare()
        controller?.play()
        refreshState()
        return true
    }

    fun playQueue(videos: List<VideoItem>, startIndex: Int = 0): Boolean {
        val playable = videos.filter { !it.mediaUrl.isNullOrBlank() }
        if (playable.isEmpty()) return false
        videosById.clear()
        playable.forEach { videosById[it.id] = it }
        _queue.value = playable
        val items = playable.map { video ->
            BackgroundAudioService.mediaItemFor(
                video.id, video.title, video.channelTitle, video.thumbnail, video.mediaUrl!!
            )
        }
        controller?.setMediaItems(items, startIndex.coerceIn(0, items.lastIndex), 0L)
        controller?.prepare()
        controller?.play()
        refreshState()
        return true
    }

    fun togglePlayPauseIfPlaying() {
        if (controller?.isPlaying == true) controller?.pause()
        refreshState()
    }

    fun togglePlayPause() {
        controller?.let { if (it.isPlaying) it.pause() else it.play() }
        refreshState()
    }

    fun playNext() { controller?.seekToNextMediaItem(); refreshState() }
    fun playPrevious() { controller?.seekToPreviousMediaItem(); refreshState() }
    fun seekTo(positionMs: Long) { controller?.seekTo(positionMs.coerceAtLeast(0L)); refreshState() }

    fun setPlaybackSpeed(speed: Float) {
        controller?.setPlaybackParameters(PlaybackParameters(speed.coerceIn(0.25f, 3f)))
        refreshState()
    }

    fun cycleRepeatMode() {
        val next = when (controller?.repeatMode) {
            Player.REPEAT_MODE_OFF -> Player.REPEAT_MODE_ALL
            Player.REPEAT_MODE_ALL -> Player.REPEAT_MODE_ONE
            else -> Player.REPEAT_MODE_OFF
        }
        controller?.repeatMode = next
        refreshState()
    }

    fun toggleShuffle() {
        controller?.shuffleModeEnabled = !(controller?.shuffleModeEnabled ?: false)
        refreshState()
    }

    fun release() {
        controller?.removeListener(listener)
        controller?.release()
        controller = null
        scope.cancel()
    }
}
