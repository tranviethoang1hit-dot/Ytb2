package com.example.ytmusicplayer

import android.annotation.SuppressLint
import android.app.PictureInPictureParams
import android.content.Context
import android.content.Intent
import android.os.Build
import android.os.Bundle
import android.os.PowerManager
import android.util.Rational
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.PictureInPictureAlt
import androidx.compose.material3.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.sp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.content.ContextCompat
import com.example.ytmusicplayer.service.BackgroundAudioService
import com.example.ytmusicplayer.ui.theme.YTMusicPlayerTheme

class YouTubePlayerActivity : ComponentActivity() {
    private val videoId: String by lazy { intent.getStringExtra(EXTRA_VIDEO_ID).orEmpty() }
    private val title: String by lazy { intent.getStringExtra(EXTRA_TITLE).orEmpty() }
    private var wakeLock: PowerManager.WakeLock? = null
    private var webView: WebView? = null

    @OptIn(ExperimentalMaterial3Api::class)
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (videoId.isBlank()) {
            finish()
            return
        }

        // 1. Acquire WakeLock to keep audio CPU active even when screen is locked/turned off
        try {
            val powerManager = getSystemService(Context.POWER_SERVICE) as PowerManager
            wakeLock = powerManager.newWakeLock(
                PowerManager.PARTIAL_WAKE_LOCK,
                "YTMusicPlayer:BackgroundAudioWakeLock"
            ).apply {
                setReferenceCounted(false)
                acquire(4 * 60 * 60 * 1000L) // 4 hours playback max
            }
        } catch (e: Exception) {
            // Safe fallback
        }

        // 2. Start Foreground Service so Android never kills or pauses background audio
        try {
            val serviceIntent = Intent(this, BackgroundAudioService::class.java).apply {
                action = BackgroundAudioService.ACTION_PLAY_YOUTUBE
                putExtra(BackgroundAudioService.EXTRA_TITLE, title)
                putExtra(BackgroundAudioService.EXTRA_VIDEO_ID, videoId)
            }
            ContextCompat.startForegroundService(this, serviceIntent)
        } catch (e: Exception) {
            // Safe fallback
        }

        setContent {
            YTMusicPlayerTheme {
                Scaffold(
                    topBar = {
                        TopAppBar(
                            title = {
                                Text(
                                    text = title.ifBlank { "YouTube Music" },
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp,
                                    maxLines = 1,
                                    overflow = TextOverflow.Ellipsis,
                                    color = Color.White
                                )
                            },
                            navigationIcon = {
                                IconButton(onClick = { finish() }) {
                                    Icon(
                                        imageVector = Icons.Default.ArrowBack,
                                        contentDescription = "Quay lại",
                                        tint = Color.White
                                    )
                                }
                            },
                            actions = {
                                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                                    IconButton(onClick = { enterPipMode() }) {
                                        Icon(
                                            imageVector = Icons.Default.PictureInPictureAlt,
                                            contentDescription = "Thu nhỏ PiP",
                                            tint = Color.White
                                        )
                                    }
                                }
                            },
                            colors = TopAppBarDefaults.topAppBarColors(
                                containerColor = Color(0xFF030303)
                            )
                        )
                    },
                    containerColor = Color.Black
                ) { innerPadding ->
                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .padding(innerPadding)
                    ) {
                        AndroidView(
                            modifier = Modifier.fillMaxWidth().weight(1f),
                            factory = { context ->
                                WebView(context).apply {
                                    this@YouTubePlayerActivity.webView = this

                                    settings.javaScriptEnabled = true
                                    settings.domStorageEnabled = true
                                    settings.mediaPlaybackRequiresUserGesture = false
                                    settings.cacheMode = WebSettings.LOAD_DEFAULT
                                    settings.loadWithOverviewMode = true
                                    settings.useWideViewPort = true
                                    settings.allowFileAccess = true
                                    settings.allowContentAccess = true

                                    webViewClient = WebViewClient()
                                    webChromeClient = WebChromeClient()

                                    // HTML with JavaScript Page Visibility & Blur overrides
                                    // Prevents YouTube from detecting screen off or window blur
                                    val embedHtml = """
                                        <!DOCTYPE html>
                                        <html>
                                        <head>
                                            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
                                            <meta name="referrer" content="strict-origin-when-cross-origin">
                                            <style>
                                                html, body {
                                                    margin: 0;
                                                    padding: 0;
                                                    width: 100%;
                                                    height: 100%;
                                                    background-color: #000000;
                                                    overflow: hidden;
                                                }
                                                iframe {
                                                    width: 100%;
                                                    height: 100%;
                                                    border: 0;
                                                }
                                            </style>
                                            <script>
                                                try {
                                                    Object.defineProperty(document, 'hidden', { get: function() { return false; }, configurable: true });
                                                    Object.defineProperty(document, 'visibilityState', { get: function() { return 'visible'; }, configurable: true });
                                                    document.addEventListener('visibilitychange', function(e) {
                                                        e.stopImmediatePropagation();
                                                    }, true);
                                                    document.addEventListener('webkitvisibilitychange', function(e) {
                                                        e.stopImmediatePropagation();
                                                    }, true);
                                                    window.addEventListener('blur', function(e) {
                                                        e.stopImmediatePropagation();
                                                    }, true);
                                                    window.addEventListener('pagehide', function(e) {
                                                        e.stopImmediatePropagation();
                                                    }, true);
                                                } catch (e) {}
                                            </script>
                                        </head>
                                        <body>
                                            <iframe
                                                src="https://www.youtube-nocookie.com/embed/$videoId?autoplay=1&playsinline=1&enablejsapi=1&rel=0&origin=https://www.youtube-nocookie.com"
                                                referrerpolicy="strict-origin-when-cross-origin"
                                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                                allowfullscreen>
                                            </iframe>
                                        </body>
                                        </html>
                                    """.trimIndent()

                                    loadDataWithBaseURL(
                                        "https://www.youtube-nocookie.com",
                                        embedHtml,
                                        "text/html",
                                        "utf-8",
                                        null
                                    )
                                }
                            }
                        )
                    }
                }
            }
        }
    }

    private fun enterPipMode() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            try {
                val params = PictureInPictureParams.Builder()
                    .setAspectRatio(Rational(16, 9))
                    .build()
                enterPictureInPictureMode(params)
            } catch (e: Exception) {
                // PiP fallback
            }
        }
    }

    override fun onUserLeaveHint() {
        super.onUserLeaveHint()
        // Automatically enter PiP mode when user presses Home button
        enterPipMode()
    }

    override fun onPause() {
        super.onPause()
        // Do NOT call webView.onPause() - allows audio to keep playing uninterrupted in background
    }

    override fun onStop() {
        super.onStop()
        // Do NOT destroy or pause webView - allows audio to keep playing when screen is locked
    }

    override fun onDestroy() {
        try {
            wakeLock?.let {
                if (it.isHeld) it.release()
            }
        } catch (e: Exception) {}

        try {
            val stopIntent = Intent(this, BackgroundAudioService::class.java).apply {
                action = BackgroundAudioService.ACTION_STOP
            }
            startService(stopIntent)
        } catch (e: Exception) {}

        webView?.destroy()
        webView = null
        super.onDestroy()
    }

    companion object {
        const val EXTRA_VIDEO_ID = "video_id"
        const val EXTRA_TITLE = "title"
    }
}
