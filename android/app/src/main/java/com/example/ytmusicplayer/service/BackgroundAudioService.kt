package com.example.ytmusicplayer.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import com.example.ytmusicplayer.MainActivity
import com.example.ytmusicplayer.R
import com.example.ytmusicplayer.YouTubePlayerActivity

/**
 * Process-local Media3 and Foreground Audio service.
 * Supports continuous background playback when exiting app or turning off screen.
 */
class BackgroundAudioService : MediaSessionService() {
    private var player: ExoPlayer? = null
    private var mediaSession: MediaSession? = null

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()

        val exoPlayer = ExoPlayer.Builder(this).build().apply {
            setHandleAudioBecomingNoisy(true)
            addListener(object : Player.Listener {
                override fun onPlaybackStateChanged(playbackState: Int) {
                    if (playbackState == Player.STATE_IDLE) {
                        stopForeground(STOP_FOREGROUND_DETACH)
                    }
                }
            })
        }
        player = exoPlayer

        val sessionActivity = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        mediaSession = MediaSession.Builder(this, exoPlayer)
            .setSessionActivity(sessionActivity)
            .build()
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        when (intent?.action) {
            ACTION_PLAY_YOUTUBE -> {
                val title = intent.getStringExtra(EXTRA_TITLE).orEmpty().ifBlank { "YouTube Music" }
                val videoId = intent.getStringExtra(EXTRA_VIDEO_ID).orEmpty()
                showForegroundNotification(title, videoId)
            }
            ACTION_STOP -> {
                stopForeground(STOP_FOREGROUND_REMOVE)
                stopSelf()
            }
        }
        return super.onStartCommand(intent, flags, startId)
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "YouTube Music Playback",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Thông báo phát nhạc nền khi tắt màn hình"
                setShowBadge(false)
            }
            val manager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    private fun showForegroundNotification(title: String, videoId: String) {
        val openIntent = Intent(this, YouTubePlayerActivity::class.java).apply {
            putExtra(YouTubePlayerActivity.EXTRA_VIDEO_ID, videoId)
            putExtra(YouTubePlayerActivity.EXTRA_TITLE, title)
            flags = Intent.FLAG_ACTIVITY_SINGLE_TOP
        }
        val openPendingIntent = PendingIntent.getActivity(
            this,
            0,
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = Intent(this, BackgroundAudioService::class.java).apply {
            action = ACTION_STOP
        }
        val stopPendingIntent = PendingIntent.getService(
            this,
            1,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notification = NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_launcher_foreground)
            .setContentTitle(title)
            .setContentText("Đang phát trên nền • Tắt màn hình vẫn nghe")
            .setContentIntent(openPendingIntent)
            .setOngoing(true)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .addAction(R.drawable.ic_launcher_foreground, "Dừng", stopPendingIntent)
            .build()

        startForeground(NOTIFICATION_ID, notification)
    }

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? = mediaSession

    override fun onTaskRemoved(rootIntent: Intent?) {
        // Keep the player alive while playback is active; Android/Media3 owns
        // the foreground lifecycle for the media session.
        if (player?.isPlaying != true) {
            // Keep running if foreground is active
        }
        super.onTaskRemoved(rootIntent)
    }

    override fun onDestroy() {
        mediaSession?.release()
        mediaSession = null
        player?.release()
        player = null
        super.onDestroy()
    }

    companion object {
        const val ACTION_PLAY_YOUTUBE = "com.example.ytmusicplayer.PLAY_YOUTUBE"
        const val ACTION_STOP = "com.example.ytmusicplayer.STOP"
        const val EXTRA_TITLE = "extra_title"
        const val EXTRA_VIDEO_ID = "extra_video_id"
        const val NOTIFICATION_ID = 1001
        const val CHANNEL_ID = "yt_music_playback_channel"

        fun mediaItemFor(id: String, title: String, artist: String, artwork: String?, mediaUrl: String): MediaItem {
            val metadata = MediaMetadata.Builder()
                .setTitle(title)
                .setArtist(artist)
                .apply {
                    if (!artwork.isNullOrBlank()) {
                        setArtworkUri(Uri.parse(artwork))
                    }
                }
                .build()

            return MediaItem.Builder()
                .setMediaId(id)
                .setUri(Uri.parse(mediaUrl))
                .setMediaMetadata(metadata)
                .build()
        }
    }
}
