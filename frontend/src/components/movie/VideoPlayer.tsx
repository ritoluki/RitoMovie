import { ChangeEvent, PointerEvent as ReactPointerEvent, useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { useTranslation } from 'react-i18next';
import {
    FiAirplay,
    FiList,
    FiMaximize,
    FiMinimize,
    FiPause,
    FiPlay,
    FiRotateCcw,
    FiRotateCw,
    FiSettings,
    FiSkipForward,
    FiVolume2,
    FiVolumeX,
} from 'react-icons/fi';

interface QualityOption {
    label: string;
    value: number;
    height?: number;
}

interface VideoPlayerProps {
    hlsSource?: string;
    embedSource?: string;
    poster?: string;
    title: string;
    onNextEpisode?: () => void;
    nextEpisodeLabel?: string;
    onEpisodeListToggle?: () => void;
    showEpisodeListButton?: boolean;
    episodeListLabel?: string;
}

const formatTime = (value: number) => {
    if (!Number.isFinite(value) || value < 0) return '00:00';
    const totalSeconds = Math.floor(value);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const clamp = (value: number, min = 0, max = 1) => Math.min(Math.max(value, min), max);

const VideoPlayer = ({
    hlsSource,
    embedSource,
    poster,
    title,
    onNextEpisode,
    nextEpisodeLabel,
    onEpisodeListToggle,
    showEpisodeListButton,
    episodeListLabel,
}: VideoPlayerProps) => {
    const { t } = useTranslation();
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const playerRef = useRef<HTMLDivElement | null>(null);
    const hlsRef = useRef<Hls | null>(null);
    const qualityMenuRef = useRef<HTMLDivElement | null>(null);
    const previewVideoRef = useRef<HTMLVideoElement | null>(null);
    const previewHlsRef = useRef<Hls | null>(null);

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isPipActive, setIsPipActive] = useState(false);
    const [availableQualities, setAvailableQualities] = useState<QualityOption[]>([]);
    const [selectedQuality, setSelectedQuality] = useState<'auto' | number>('auto');
    const [qualityMenuOpen, setQualityMenuOpen] = useState(false);
    const [isHoveringProgress, setIsHoveringProgress] = useState(false);
    const [previewTime, setPreviewTime] = useState(0);
    const [previewPercent, setPreviewPercent] = useState(0);
    const [previewReady, setPreviewReady] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [isHoveringPlayer, setIsHoveringPlayer] = useState(false);
    const hideControlsTimeoutRef = useRef<number | null>(null);

    const pipSupported = typeof document !== 'undefined' && (document as Document & {
        pictureInPictureEnabled?: boolean;
    }).pictureInPictureEnabled;

    // Logic ẩn/hiện controls
    const resetHideControlsTimer = (forceShow = true) => {
        if (hideControlsTimeoutRef.current) {
            clearTimeout(hideControlsTimeoutRef.current);
        }

        if (forceShow) {
            setShowControls(true);
        }

        // Chỉ thiết lập timer tự động ẩn khi đang fullscreen, đang phát, và không có menu mở
        if (isFullscreen && isPlaying && !qualityMenuOpen) {
            hideControlsTimeoutRef.current = window.setTimeout(() => {
                setShowControls(false);
            }, 5000);
        }
    };

    const handleMouseMove = () => {
        if (isFullscreen) {
            resetHideControlsTimer();
        }
    };

    const handleMouseEnter = () => {
        setIsHoveringPlayer(true);
        if (!isFullscreen) {
            setShowControls(true);
        } else {
            resetHideControlsTimer();
        }
    };

    const handleMouseLeave = () => {
        setIsHoveringPlayer(false);
        if (!isFullscreen) {
            setShowControls(true);
        }
    }; useEffect(() => {
        // Reset timer khi trạng thái thay đổi
        if (isFullscreen && isPlaying && !qualityMenuOpen) {
            setShowControls(true);
            if (hideControlsTimeoutRef.current) {
                clearTimeout(hideControlsTimeoutRef.current);
            }
            // Thiết lập timer tự động ẩn sau 5 giây
            hideControlsTimeoutRef.current = window.setTimeout(() => {
                setShowControls(false);
            }, 5000);
        } else if (!isFullscreen) {
            setShowControls(true);
            if (hideControlsTimeoutRef.current) {
                clearTimeout(hideControlsTimeoutRef.current);
            }
        } else if (isFullscreen && !isPlaying) {
            setShowControls(true);
            if (hideControlsTimeoutRef.current) {
                clearTimeout(hideControlsTimeoutRef.current);
            }
        } else if (qualityMenuOpen) {
            // Khi menu mở, giữ controls hiển thị
            setShowControls(true);
            if (hideControlsTimeoutRef.current) {
                clearTimeout(hideControlsTimeoutRef.current);
            }
        }

        return () => {
            if (hideControlsTimeoutRef.current) {
                clearTimeout(hideControlsTimeoutRef.current);
            }
        };
    }, [isFullscreen, isPlaying, qualityMenuOpen]);

    // Xử lý phím tắt
    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Bỏ qua nếu đang focus vào input hoặc textarea
            const target = event.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                return;
            }

            switch (event.code) {
                case 'Space':
                    event.preventDefault();
                    togglePlay();
                    break;
                case 'ArrowLeft':
                    event.preventDefault();
                    seekBy(-10);
                    break;
                case 'ArrowRight':
                    event.preventDefault();
                    seekBy(10);
                    break;
                case 'ArrowUp':
                    event.preventDefault();
                    handleVolumeUp();
                    break;
                case 'ArrowDown':
                    event.preventDefault();
                    handleVolumeDown();
                    break;
                case 'KeyF':
                    event.preventDefault();
                    toggleFullscreen();
                    break;
                case 'KeyM':
                    event.preventDefault();
                    toggleMute();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isPlaying, volume, isMuted, isFullscreen]);

    useEffect(() => {
        setPreviewReady(false);
        setPreviewLoading(false);
        setIsHoveringProgress(false);
        setPreviewTime(0);
        setPreviewPercent(0);
    }, [hlsSource]);

    useEffect(() => {
        const videoEl = videoRef.current;

        if (!videoEl || !hlsSource) {
            return () => {
                if (hlsRef.current) {
                    hlsRef.current.destroy();
                    hlsRef.current = null;
                }
            };
        }

        if (Hls.isSupported()) {
            const hls = new Hls({ enableWorker: true });
            hls.loadSource(hlsSource);
            hls.attachMedia(videoEl);
            hlsRef.current = hls;

            const handleManifest = () => {
                const unique = hls.levels.reduce<QualityOption[]>((acc, level, index) => {
                    const exists = acc.some((item) => item.height === level.height);
                    if (exists) return acc;
                    return [
                        ...acc,
                        {
                            label: level.height ? `${level.height}p` : `${Math.round(level.bitrate / 1000)}kb`,
                            value: index,
                            height: level.height,
                        },
                    ];
                }, []);
                setAvailableQualities(unique);
            };

            const handleLevelSwitch = (_event: string, data: { level: number }) => {
                setSelectedQuality(data.level === -1 ? 'auto' : data.level);
            };

            hls.on(Hls.Events.MANIFEST_PARSED, handleManifest);
            hls.on(Hls.Events.LEVEL_SWITCHED, handleLevelSwitch);

            return () => {
                hls.off(Hls.Events.MANIFEST_PARSED, handleManifest);
                hls.off(Hls.Events.LEVEL_SWITCHED, handleLevelSwitch);
                hls.destroy();
                hlsRef.current = null;
            };
        }

        if (videoEl.canPlayType('application/vnd.apple.mpegurl')) {
            videoEl.src = hlsSource;
        } else {
            videoEl.src = hlsSource;
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy();
                hlsRef.current = null;
            }
        };
    }, [hlsSource]);

    useEffect(() => {
        const previewVideo = previewVideoRef.current;
        if (!previewVideo || !hlsSource) {
            return () => {
                if (previewHlsRef.current) {
                    previewHlsRef.current.destroy();
                    previewHlsRef.current = null;
                }
            };
        }

        previewVideo.muted = true;
        previewVideo.playsInline = true;
        previewVideo.preload = 'metadata';
        previewVideo.pause();

        if (Hls.isSupported()) {
            const previewHls = new Hls({ enableWorker: true, autoStartLoad: false });
            previewHls.loadSource(hlsSource);
            previewHls.attachMedia(previewVideo);
            previewHlsRef.current = previewHls;

            const startLoad = () => {
                previewHls.startLoad(0);
            };

            previewHls.on(Hls.Events.MANIFEST_PARSED, startLoad);

            return () => {
                previewHls.off(Hls.Events.MANIFEST_PARSED, startLoad);
                previewHls.destroy();
                previewHlsRef.current = null;
            };
        }

        previewVideo.src = hlsSource;

        return () => {
            previewVideo.removeAttribute('src');
            previewVideo.load();
        };
    }, [hlsSource]);

    useEffect(() => {
        const previewVideo = previewVideoRef.current;
        if (!previewVideo) return;

        const handleLoadedMetadata = () => {
            setPreviewReady(true);
            previewVideo.pause();
        };
        const handleSeeking = () => setPreviewLoading(true);
        const handleSeeked = () => {
            setPreviewLoading(false);
            previewVideo.pause();
        };

        previewVideo.addEventListener('loadedmetadata', handleLoadedMetadata);
        previewVideo.addEventListener('seeking', handleSeeking);
        previewVideo.addEventListener('seeked', handleSeeked);

        return () => {
            previewVideo.removeEventListener('loadedmetadata', handleLoadedMetadata);
            previewVideo.removeEventListener('seeking', handleSeeking);
            previewVideo.removeEventListener('seeked', handleSeeked);
        };
    }, []);

    useEffect(() => {
        const videoEl = videoRef.current;
        if (!videoEl) return;

        const handleLoadedMetadata = () => setDuration(videoEl.duration || 0);
        const handleTimeUpdate = () => setCurrentTime(videoEl.currentTime);
        const handlePlay = () => setIsPlaying(true);
        const handlePause = () => setIsPlaying(false);
        const handleVolumeChange = () => {
            setVolume(videoEl.volume);
            setIsMuted(videoEl.muted || videoEl.volume === 0);
        };

        videoEl.addEventListener('loadedmetadata', handleLoadedMetadata);
        videoEl.addEventListener('timeupdate', handleTimeUpdate);
        videoEl.addEventListener('play', handlePlay);
        videoEl.addEventListener('pause', handlePause);
        videoEl.addEventListener('volumechange', handleVolumeChange);

        return () => {
            videoEl.removeEventListener('loadedmetadata', handleLoadedMetadata);
            videoEl.removeEventListener('timeupdate', handleTimeUpdate);
            videoEl.removeEventListener('play', handlePlay);
            videoEl.removeEventListener('pause', handlePause);
            videoEl.removeEventListener('volumechange', handleVolumeChange);
        };
    }, []);

    useEffect(() => {
        if (!qualityMenuOpen) return undefined;

        const handleClickOutside = (event: MouseEvent) => {
            if (qualityMenuRef.current && !qualityMenuRef.current.contains(event.target as Node)) {
                setQualityMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [qualityMenuOpen]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    useEffect(() => {
        const videoEl = videoRef.current;
        if (!videoEl) return;

        const handleEnter = () => setIsPipActive(true);
        const handleLeave = () => setIsPipActive(false);

        videoEl.addEventListener('enterpictureinpicture', handleEnter);
        videoEl.addEventListener('leavepictureinpicture', handleLeave);

        return () => {
            videoEl.removeEventListener('enterpictureinpicture', handleEnter);
            videoEl.removeEventListener('leavepictureinpicture', handleLeave);
        };
    }, []);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = volume;
        }
    }, [volume]);

    const togglePlay = () => {
        const videoEl = videoRef.current;
        if (!videoEl) return;

        if (videoEl.paused) {
            videoEl.play().catch(() => undefined);
        } else {
            videoEl.pause();
        }

        // Reset timer khi user tương tác
        if (isFullscreen) {
            resetHideControlsTimer();
        }
    };

    const handleSeek = (event: ChangeEvent<HTMLInputElement>) => {
        const videoEl = videoRef.current;
        if (!videoEl) return;
        const nextTime = Number(event.target.value);
        videoEl.currentTime = nextTime;
        setCurrentTime(nextTime);
    };

    const seekBy = (offset: number) => {
        const videoEl = videoRef.current;
        if (!videoEl) return;
        const nextTime = Math.min(Math.max(videoEl.currentTime + offset, 0), videoEl.duration || 0);
        videoEl.currentTime = nextTime;
        setCurrentTime(nextTime);
    };

    const handleVolumeChange = (event: ChangeEvent<HTMLInputElement>) => {
        const videoEl = videoRef.current;
        if (!videoEl) return;
        const value = Number(event.target.value);
        setVolume(value);
        videoEl.volume = value;
        const muted = value === 0;
        setIsMuted(muted);
        videoEl.muted = muted;
    };

    const handleVolumeUp = () => {
        const videoEl = videoRef.current;
        if (!videoEl) return;
        const newVolume = Math.min(volume + 0.1, 1);
        setVolume(newVolume);
        videoEl.volume = newVolume;
        if (newVolume > 0) {
            setIsMuted(false);
            videoEl.muted = false;
        }
    };

    const handleVolumeDown = () => {
        const videoEl = videoRef.current;
        if (!videoEl) return;
        const newVolume = Math.max(volume - 0.1, 0);
        setVolume(newVolume);
        videoEl.volume = newVolume;
        if (newVolume === 0) {
            setIsMuted(true);
            videoEl.muted = true;
        }
    };

    const toggleMute = () => {
        const videoEl = videoRef.current;
        if (!videoEl) return;
        const nextMuted = !isMuted;
        setIsMuted(nextMuted);
        videoEl.muted = nextMuted;
        if (!nextMuted && videoEl.volume === 0) {
            setVolume(0.5);
            videoEl.volume = 0.5;
        }
    };

    const toggleFullscreen = () => {
        const container = playerRef.current;
        if (!container) return;

        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => undefined);
        } else {
            container.requestFullscreen().catch(() => undefined);
        }
    };

    const togglePictureInPicture = async () => {
        if (!pipSupported || !videoRef.current) return;

        try {
            if ((document as Document & { pictureInPictureElement?: Element }).pictureInPictureElement) {
                await (document as Document & { exitPictureInPicture?: () => Promise<void> }).exitPictureInPicture?.();
            } else if (videoRef.current.requestPictureInPicture) {
                await videoRef.current.requestPictureInPicture();
            }
        } catch (error) {
            // Picture-in-picture can be blocked by the browser; fail silently.
        }
    };

    const handleQualitySelect = (value: 'auto' | number) => {
        if (!hlsRef.current) {
            setSelectedQuality(value);
            setQualityMenuOpen(false);
            return;
        }

        if (value === 'auto') {
            hlsRef.current.currentLevel = -1;
        } else {
            hlsRef.current.currentLevel = value;
        }
        setSelectedQuality(value);
        setQualityMenuOpen(false);
    };

    const updatePreviewFromPointer = (event: ReactPointerEvent<HTMLInputElement>) => {
        if (!duration) return;
        const rect = event.currentTarget.getBoundingClientRect();
        const ratio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
        const targetTime = ratio * duration;
        setPreviewPercent(ratio);
        setPreviewTime(targetTime);
        setIsHoveringProgress(true);

        if (previewVideoRef.current && previewReady) {
            try {
                previewVideoRef.current.currentTime = targetTime;
            } catch (error) {
                // Ignore preview seek errors
            }
        }
    };

    const handleProgressPointerLeave = () => {
        setIsHoveringProgress(false);
    };

    if (!hlsSource && embedSource) {
        return (
            <iframe
                src={embedSource}
                title={title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
            />
        );
    }

    if (!hlsSource) {
        return (
            <div className="w-full h-full flex items-center justify-center text-white bg-gray-900">
                <p className="text-center text-sm md:text-base text-gray-300 max-w-md px-4">
                    {t('movie.noStreamingData')}
                </p>
            </div>
        );
    }

    const progressMax = duration || 0;
    const progressValue = Math.min(currentTime, progressMax);
    const showNextButton = Boolean(onNextEpisode);
    const showPreview = isHoveringProgress && progressMax > 0;
    const previewStatusReady = previewReady && !previewLoading;

    return (
        <div
            ref={playerRef}
            className="relative w-full h-full bg-black"
            style={{ cursor: isFullscreen && !showControls ? 'none' : 'default' }}
            onMouseMove={handleMouseMove}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <video
                ref={videoRef}
                className="w-full h-full object-contain bg-black"
                autoPlay
                playsInline
                poster={poster}
                title={title}
                muted={isMuted}
                onClick={togglePlay}
            />

            <div
                className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-4 pt-6 pb-4 space-y-3 transition-opacity duration-300"
                style={{
                    opacity: showControls ? 1 : 0,
                    pointerEvents: showControls ? 'auto' : 'none'
                }}
            >
                <div className="flex items-center gap-3">
                    <span className="text-xs text-white/70 min-w-[3.5rem] text-right">{formatTime(progressValue)}</span>
                    <div className="relative flex-1">
                        <div
                            className="absolute -top-40 left-0 w-56 pointer-events-none transition-all duration-150"
                            style={{
                                opacity: showPreview ? 1 : 0,
                                visibility: showPreview ? 'visible' : 'hidden',
                                left: `${(previewPercent * 100).toFixed(2)}%`,
                                transform: 'translateX(-50%)',
                            }}
                        >
                            <div className="rounded-2xl border border-white/15 bg-black/90 shadow-2xl overflow-hidden">
                                <div className="relative w-56 h-32 bg-black">
                                    <video
                                        ref={previewVideoRef}
                                        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-150 ${previewStatusReady ? 'opacity-100' : 'opacity-0'
                                            }`}
                                        muted
                                        playsInline
                                        preload="metadata"
                                        poster={poster}
                                    />
                                    {!previewStatusReady && (
                                        <div className="absolute inset-0 flex items-center justify-center text-[11px] text-white/70 bg-black/70 px-3 text-center">
                                            {t('watch.previewLoading')}
                                        </div>
                                    )}
                                    <span className="absolute bottom-1 right-1 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-semibold">
                                        {formatTime(previewTime)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <input
                            type="range"
                            min={0}
                            max={progressMax}
                            step={0.1}
                            value={progressValue}
                            onChange={handleSeek}
                            onPointerMove={updatePreviewFromPointer}
                            onPointerEnter={updatePreviewFromPointer}
                            onPointerLeave={handleProgressPointerLeave}
                            className="video-progress w-full"
                        />
                    </div>
                    <span className="text-xs text-white/70 min-w-[3.5rem]">{progressMax ? formatTime(progressMax) : '00:00'}</span>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4 text-white">
                    <div className={`flex items-center gap-3 ${isFullscreen ? '' : 'hidden md:flex'}`}>
                        <button
                            type="button"
                            onClick={togglePlay}
                            className="control-button h-11 w-11"
                            aria-label={isPlaying ? t('watch.pause') : t('watch.play')}
                        >
                            {isPlaying ? <FiPause size={20} /> : <FiPlay size={20} />}
                        </button>

                        <button type="button" onClick={() => seekBy(-10)} className="control-button" aria-label={t('watch.rewind10')}>
                            <FiRotateCcw size={18} />
                        </button>

                        <button type="button" onClick={() => seekBy(10)} className="control-button" aria-label={t('watch.forward10')}>
                            <FiRotateCw size={18} />
                        </button>

                        <button
                            type="button"
                            onClick={toggleMute}
                            className="control-button"
                            aria-label={isMuted ? t('watch.unmute') : t('watch.mute')}
                        >
                            {isMuted || volume === 0 ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
                        </button>

                        <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.05}
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                            className="video-volume"
                            aria-label={t('watch.volume')}
                        />
                    </div>

                    <div className={`flex items-center gap-3 ${isFullscreen ? '' : 'hidden md:flex'}`}>
                        {showEpisodeListButton && onEpisodeListToggle && (
                            <button
                                type="button"
                                onClick={onEpisodeListToggle}
                                className="control-button"
                                aria-label={episodeListLabel || t('watch.toggleEpisodes')}
                                title={episodeListLabel || t('watch.toggleEpisodes')}
                            >
                                <FiList size={18} />
                            </button>
                        )}

                        {showNextButton && (
                            <button
                                type="button"
                                onClick={onNextEpisode}
                                className="control-button"
                                aria-label={nextEpisodeLabel || t('watch.nextEpisode')}
                                title={nextEpisodeLabel || t('watch.nextEpisode')}
                            >
                                <FiSkipForward size={18} />
                            </button>
                        )}

                        {pipSupported && (
                            <button
                                type="button"
                                onClick={togglePictureInPicture}
                                className={`control-button ${isPipActive ? 'bg-white/25' : ''}`}
                                aria-label={t('watch.pictureInPicture')}
                                title={t('watch.pictureInPicture')}
                            >
                                <FiAirplay size={18} />
                            </button>
                        )}

                        <div className="relative" ref={qualityMenuRef}>
                            <button
                                type="button"
                                onClick={() => setQualityMenuOpen((prev) => !prev)}
                                className={`control-button ${qualityMenuOpen ? 'bg-white/25' : ''}`}
                                aria-haspopup="menu"
                                aria-expanded={qualityMenuOpen}
                                aria-label={t('watch.quality')}
                                title={t('watch.quality')}
                            >
                                <FiSettings size={18} />
                            </button>

                            {qualityMenuOpen && (
                                <div className="absolute bottom-14 right-0 w-36 rounded-xl border border-white/15 bg-black/90 backdrop-blur-lg p-2 space-y-1 text-sm">
                                    <button
                                        type="button"
                                        className={`w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 ${selectedQuality === 'auto' ? 'bg-white/10 text-white' : 'text-white/80'
                                            }`}
                                        onClick={() => handleQualitySelect('auto')}
                                    >
                                        {t('watch.autoQuality')}
                                    </button>
                                    {availableQualities.map((quality) => (
                                        <button
                                            key={quality.value}
                                            type="button"
                                            className={`w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 ${selectedQuality === quality.value ? 'bg-white/10 text-white' : 'text-white/80'
                                                }`}
                                            onClick={() => handleQualitySelect(quality.value)}
                                        >
                                            {quality.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        <button
                            type="button"
                            onClick={toggleFullscreen}
                            className="control-button"
                            aria-label={isFullscreen ? t('watch.exitFullscreen') : t('watch.fullscreen')}
                            title={isFullscreen ? t('watch.exitFullscreen') : t('watch.fullscreen')}
                        >
                            {isFullscreen ? <FiMinimize size={18} /> : <FiMaximize size={18} />}
                        </button>
                    </div>

                    {/* Mobile: Chỉ hiển thị nút fullscreen khi không ở chế độ fullscreen */}
                    {!isFullscreen && (
                        <div className="md:hidden ml-auto">
                            <button
                                type="button"
                                onClick={toggleFullscreen}
                                className="control-button"
                                aria-label={t('watch.fullscreen')}
                                title={t('watch.fullscreen')}
                            >
                                <FiMaximize size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default VideoPlayer;
