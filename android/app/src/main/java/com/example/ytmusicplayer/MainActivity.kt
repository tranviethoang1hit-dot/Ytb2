package com.example.ytmusicplayer

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.lifecycle.ViewModelProvider
import com.example.ytmusicplayer.ui.screens.MainScreen
import com.example.ytmusicplayer.ui.theme.YTMusicPlayerTheme
import com.example.ytmusicplayer.ui.viewmodel.PlayerViewModel

class MainActivity : ComponentActivity() {
    private lateinit var viewModel: PlayerViewModel

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        viewModel = ViewModelProvider(this)[PlayerViewModel::class.java]
        setContent {
            YTMusicPlayerTheme {
                MainScreen(viewModel = viewModel)
            }
        }
    }
}
