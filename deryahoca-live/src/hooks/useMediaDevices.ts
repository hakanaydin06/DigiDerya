'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface UseMediaDevicesOptions {
    video?: boolean;
    audio?: boolean;
}

interface MediaDeviceState {
    stream: MediaStream | null;
    videoDevices: MediaDeviceInfo[];
    audioDevices: MediaDeviceInfo[];
    selectedVideoDevice: string;
    selectedAudioDevice: string;
    isMuted: boolean;
    isCameraOff: boolean;
    error: string | null;
    isLoading: boolean;
}

export const useMediaDevices = (options: UseMediaDevicesOptions = { video: true, audio: true }) => {
    const [state, setState] = useState<MediaDeviceState>({
        stream: null,
        videoDevices: [],
        audioDevices: [],
        selectedVideoDevice: '',
        selectedAudioDevice: '',
        isMuted: false,
        isCameraOff: false,
        error: null,
        isLoading: true,
    });

    const streamRef = useRef<MediaStream | null>(null);

    // Get available devices
    const getDevices = useCallback(async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(d => d.kind === 'videoinput');
            const audioDevices = devices.filter(d => d.kind === 'audioinput');

            setState(prev => ({
                ...prev,
                videoDevices,
                audioDevices,
                selectedVideoDevice: videoDevices[0]?.deviceId || '',
                selectedAudioDevice: audioDevices[0]?.deviceId || '',
            }));
        } catch (err) {
            console.error('Error getting devices:', err);
        }
    }, []);

    // Initialize media stream
    const initializeStream = useCallback(async (videoDeviceId?: string, audioDeviceId?: string) => {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        try {
            // Stop existing stream
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }

            const constraints: MediaStreamConstraints = {
                video: options.video ? {
                    deviceId: videoDeviceId ? { exact: videoDeviceId } : undefined,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'user',
                } : false,
                audio: options.audio ? {
                    deviceId: audioDeviceId ? { exact: audioDeviceId } : undefined,
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                } : false,
            };

            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            streamRef.current = stream;

            setState(prev => ({
                ...prev,
                stream,
                isLoading: false,
                error: null,
            }));

            // Refresh device list after getting permission
            await getDevices();

            return stream;
        } catch (err) {
            const error = err as Error;
            let errorMessage = 'Kamera veya mikrofon erişimi sağlanamadı.';

            if (error.name === 'NotAllowedError') {
                errorMessage = 'Kamera ve mikrofon izni reddedildi. Lütfen tarayıcı ayarlarından izin verin.';
            } else if (error.name === 'NotFoundError') {
                errorMessage = 'Kamera veya mikrofon bulunamadı. Lütfen cihazlarınızı kontrol edin.';
            } else if (error.name === 'NotReadableError') {
                errorMessage = 'Kamera veya mikrofon başka bir uygulama tarafından kullanılıyor.';
            }

            setState(prev => ({
                ...prev,
                stream: null,
                isLoading: false,
                error: errorMessage,
            }));

            return null;
        }
    }, [options.video, options.audio, getDevices]);

    // Toggle audio
    const toggleAudio = useCallback(() => {
        if (streamRef.current) {
            const audioTracks = streamRef.current.getAudioTracks();
            audioTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            setState(prev => ({ ...prev, isMuted: !prev.isMuted }));
        }
    }, []);

    // Toggle video
    const toggleVideo = useCallback(() => {
        if (streamRef.current) {
            const videoTracks = streamRef.current.getVideoTracks();
            videoTracks.forEach(track => {
                track.enabled = !track.enabled;
            });
            setState(prev => ({ ...prev, isCameraOff: !prev.isCameraOff }));
        }
    }, []);

    // Switch video device
    const switchVideoDevice = useCallback(async (deviceId: string) => {
        setState(prev => ({ ...prev, selectedVideoDevice: deviceId }));
        await initializeStream(deviceId, state.selectedAudioDevice);
    }, [initializeStream, state.selectedAudioDevice]);

    // Switch audio device
    const switchAudioDevice = useCallback(async (deviceId: string) => {
        setState(prev => ({ ...prev, selectedAudioDevice: deviceId }));
        await initializeStream(state.selectedVideoDevice, deviceId);
    }, [initializeStream, state.selectedVideoDevice]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Stop all tracks
    const stopStream = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
            setState(prev => ({ ...prev, stream: null }));
        }
    }, []);

    return {
        ...state,
        initializeStream,
        toggleAudio,
        toggleVideo,
        switchVideoDevice,
        switchAudioDevice,
        stopStream,
        getDevices,
    };
};
