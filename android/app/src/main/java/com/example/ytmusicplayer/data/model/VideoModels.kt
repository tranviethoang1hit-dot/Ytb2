package com.example.ytmusicplayer.data.model

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.google.gson.annotations.SerializedName

data class VideoItem(
    @SerializedName("id") val id: String,
    @SerializedName("title") val title: String,
    @SerializedName("channelTitle") val channelTitle: String,
    @SerializedName("thumbnail") val thumbnail: String,
    @SerializedName("duration") val duration: String? = null,
    @SerializedName("views") val views: String? = null,
    @SerializedName("publishedAt") val publishedAt: String? = null,
    /** Direct/local media URL. Null for YouTube-only items. */
    @SerializedName("mediaUrl") val mediaUrl: String? = null
)

enum class RepeatMode {
    NONE,
    ALL,
    ONE
}

data class Category(
    val id: String,
    val name: String,
    val iconName: String,
    val query: String,
    val description: String? = null
)

data class AdBlockStats(
    val blockedCount: Int = 0,
    val timeSavedSeconds: Int = 0,
    val isAdBlockActive: Boolean = true,
    val adCurrentlyDetected: Boolean = false
)

enum class VideoResolutionId(val label: String, val resolution: String, val format: String) {
    ORIGINAL("Nguyên bản", "Original", "media")
}

data class DownloadTask(
    val videoId: String,
    val video: VideoItem,
    val resolution: VideoResolutionId,
    val progress: Int = 0,
    val status: DownloadStatus = DownloadStatus.PENDING,
    val errorMessage: String? = null,
    val startTime: Long = System.currentTimeMillis()
)

enum class DownloadStatus {
    PENDING,
    DOWNLOADING,
    SAVING,
    COMPLETED,
    ERROR
}

data class PlayerState(
    val currentVideo: VideoItem? = null,
    val isPlaying: Boolean = false,
    val isBuffering: Boolean = false,
    val currentPositionMs: Long = 0L,
    val durationMs: Long = 0L,
    val playbackSpeed: Float = 1.0f,
    val repeatMode: RepeatMode = RepeatMode.NONE,
    val isShuffle: Boolean = false,
    val isMuted: Boolean = false,
    val volume: Float = 1.0f
)

@Entity(tableName = "favorites")
data class FavoriteEntity(
    @PrimaryKey val id: String,
    val title: String,
    val channelTitle: String,
    val thumbnail: String,
    val duration: String?,
    val views: String?,
    val addedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "history")
data class HistoryEntity(
    @PrimaryKey val id: String,
    val title: String,
    val channelTitle: String,
    val thumbnail: String,
    val duration: String?,
    val views: String?,
    val playedAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "playlists")
data class PlaylistEntity(
    @PrimaryKey val id: String,
    val title: String,
    val description: String?,
    val videosJson: String, // JSON serialized List<VideoItem>
    val createdAt: Long = System.currentTimeMillis()
)

@Entity(tableName = "offline_videos")
data class OfflineVideoEntity(
    @PrimaryKey val id: String,
    val videoId: String,
    val title: String,
    val channelTitle: String,
    val thumbnail: String,
    val duration: String?,
    val resolution: String,
    val format: String,
    val localFilePath: String,
    val sizeBytes: Long,
    val downloadedAt: Long = System.currentTimeMillis()
)
