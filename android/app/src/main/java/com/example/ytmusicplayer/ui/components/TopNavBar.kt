package com.example.ytmusicplayer.ui.components

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.example.ytmusicplayer.ui.theme.RedPrimary

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TopNavBar(
    searchQuery: String,
    onSearchChange: (String) -> Unit,
    onSearchSubmit: (String) -> Unit,
    sleepTimerSeconds: Int?,
    onOpenSleepTimer: () -> Unit,
    onOpenDirectUrl: () -> Unit,
    onOpenAdShield: () -> Unit
) {
    var isSearchExpanded by remember { mutableStateOf(false) }
    var showOptionsMenu by remember { mutableStateOf(false) }
    val focusManager = LocalFocusManager.current

    Surface(
        color = Color(0xFF030303),
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                // Official YouTube Music Brand Header
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.clickable { isSearchExpanded = false }
                ) {
                    Box(
                        modifier = Modifier
                            .size(34.dp)
                            .clip(CircleShape)
                            .background(RedPrimary),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.PlayArrow,
                            contentDescription = null,
                            tint = Color.White,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Text(
                        text = "Music",
                        fontWeight = FontWeight.Black,
                        fontSize = 22.sp,
                        letterSpacing = (-0.5).sp,
                        color = Color.White
                    )
                }

                // Sleek Header Action Buttons
                Row(verticalAlignment = Alignment.CenterVertically) {
                    // Search toggle button
                    IconButton(
                        onClick = { isSearchExpanded = !isSearchExpanded },
                        modifier = Modifier.size(40.dp)
                    ) {
                        Icon(
                            imageVector = if (isSearchExpanded) Icons.Default.Close else Icons.Default.Search,
                            contentDescription = "Tìm kiếm",
                            tint = Color.White,
                            modifier = Modifier.size(24.dp)
                        )
                    }

                    Spacer(modifier = Modifier.width(4.dp))

                    // Options menu with badge for sleep timer
                    Box {
                        IconButton(
                            onClick = { showOptionsMenu = true },
                            modifier = Modifier.size(40.dp)
                        ) {
                            BadgedBox(
                                badge = {
                                    if (sleepTimerSeconds != null) {
                                        val mins = sleepTimerSeconds / 60
                                        Badge(containerColor = RedPrimary) {
                                            Text("${mins}m", fontSize = 8.sp, color = Color.White)
                                        }
                                    }
                                }
                            ) {
                                Icon(
                                    imageVector = Icons.Default.MoreVert,
                                    contentDescription = "Tiện ích & Cài đặt",
                                    tint = Color.White,
                                    modifier = Modifier.size(24.dp)
                                )
                            }
                        }

                        DropdownMenu(
                            expanded = showOptionsMenu,
                            onDismissRequest = { showOptionsMenu = false },
                            modifier = Modifier.background(Color(0xFF212121))
                        ) {
                            DropdownMenuItem(
                                text = {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Text("Hẹn giờ ngủ", color = Color.White)
                                        if (sleepTimerSeconds != null) {
                                            Spacer(modifier = Modifier.width(8.dp))
                                            Text("(${sleepTimerSeconds / 60}p)", color = RedPrimary, fontSize = 12.sp)
                                        }
                                    }
                                },
                                leadingIcon = {
                                    Icon(Icons.Default.Bedtime, contentDescription = null, tint = RedPrimary)
                                },
                                onClick = {
                                    showOptionsMenu = false
                                    onOpenSleepTimer()
                                }
                            )
                            DropdownMenuItem(
                                text = { Text("Mở link trực tiếp", color = Color.White) },
                                leadingIcon = {
                                    Icon(Icons.Default.Link, contentDescription = null, tint = Color.LightGray)
                                },
                                onClick = {
                                    showOptionsMenu = false
                                    onOpenDirectUrl()
                                }
                            )
                            DropdownMenuItem(
                                text = { Text("Trạng thái chặn QC", color = Color.White) },
                                leadingIcon = {
                                    Icon(Icons.Default.Shield, contentDescription = null, tint = Color(0xFF10B981))
                                },
                                onClick = {
                                    showOptionsMenu = false
                                    onOpenAdShield()
                                }
                            )
                        }
                    }
                }
            }

            // Expanded Modern Search Box
            AnimatedVisibility(
                visible = isSearchExpanded,
                enter = fadeIn(),
                exit = fadeOut()
            ) {
                Column {
                    Spacer(modifier = Modifier.height(10.dp))
                    TextField(
                        value = searchQuery,
                        onValueChange = onSearchChange,
                        modifier = Modifier
                            .fillMaxWidth()
                            .clip(RoundedCornerShape(24.dp)),
                        placeholder = { Text("Tìm bài hát, nghệ sĩ, podcast...", fontSize = 14.sp, color = Color(0xFF888888)) },
                        leadingIcon = {
                            Icon(Icons.Default.Search, contentDescription = null, tint = Color(0xFFAAAAAA))
                        },
                        trailingIcon = {
                            if (searchQuery.isNotEmpty()) {
                                IconButton(onClick = { onSearchChange("") }) {
                                    Icon(Icons.Default.Clear, contentDescription = "Xóa", tint = Color(0xFFAAAAAA))
                                }
                            }
                        },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                        keyboardActions = KeyboardActions(onSearch = {
                            onSearchSubmit(searchQuery)
                            focusManager.clearFocus()
                        }),
                        colors = TextFieldDefaults.colors(
                            focusedContainerColor = Color(0xFF1E1E1E),
                            unfocusedContainerColor = Color(0xFF1E1E1E),
                            focusedIndicatorColor = Color.Transparent,
                            unfocusedIndicatorColor = Color.Transparent,
                            focusedTextColor = Color.White,
                            unfocusedTextColor = Color.White
                        )
                    )
                }
            }
        }
    }
}
