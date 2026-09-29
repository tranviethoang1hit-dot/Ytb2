package com.example.ytmusicplayer.service

import android.app.PendingIntent
import android.content.Intent
import android.net.Uri
import androidx.media3.common.MediaItem
import androidx.media3.common.MediaMetadata
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService
import com.example.ytmusicplayer.MainActivity

/**
 * Process-local Media3 service. The UI talks to it through MediaController,
 * not a custom Binder. This keeps lock-screen, Bluetooth and notification
 * controls on the same MediaSession path.
 *
 * Only direct media URLs (local files or media servers that the user is
 * authorized to access) are handed to ExoPlayer. YouTube video IDs are
 * opened with the official embedded player activity instead of attempting
 * to extract or download protected YouTube streams.
 */
class BackgroundAudioService : MediaSessionService() {
    private var player: ExoPlayer? = null
    private var mediaSession: MediaSession? = null

    override fun onCreate() {
        super.onCreate()
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

    override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? = mediaSession

    override fun onTaskRemoved(rootIntent: Intent?) {
        // Keep the player alive while playback is active; Android/Media3 owns
        // the foreground lifecycle for the media session.
        if (player?.isPlaying != true) {
            stopSelf()
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
