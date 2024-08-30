window.addEventListener('DOMContentLoaded', () => {
    // Obtener configuraciones de personalización desde el servidor
    fetch('/settings')
        .then(response => response.json())
        .then(settings => {
            const logoImage = document.getElementById('logoImage');
            const titleContainer = document.getElementById('titleContainer');
            const subtitleContainer = document.getElementById('subtitleContainer');
            document.body.style.setProperty('--primary-color', settings.color || '#00BFFF');
            document.body.style.setProperty('--secondary-color', settings.secondaryColor || '#FFFFFF');
            document.body.style.setProperty('--tertiary-color', settings.tertiaryColor || '#CCCCCC');
            document.body.style.setProperty('--button-color', settings.buttonColor || '#007BFF');
            document.body.style.fontFamily = settings.font || 'Arial';
            document.body.style.color = settings.fontColor || '#000';
            document.body.style.fontStyle = settings.isItalic ? 'italic' : 'normal';
            
            if (settings.logo) {
                logoImage.src = settings.logo;
            }
            titleContainer.textContent = settings.title || 'Plataforma de Streaming';
            subtitleContainer.textContent = settings.subtitle || '';
        })
        .catch(error => {
            console.error('Error al cargar las configuraciones:', error);
        });

    // Cargar videos al iniciar la página
    loadVideos();
});

// Función para cargar los videos desde el servidor
function loadVideos() {
    fetch('/videos')
        .then(response => response.json())
        .then(data => {
            const videoContainer = document.getElementById('videosDisplay');
            const noVideosMessage = document.getElementById('noVideosMessage');

            videoContainer.style.backgroundColor = 'var(--secondary-color)';

            // Mostrar videos si existen
            if (data.length > 0) {
                noVideosMessage.style.display = 'none';
                videoContainer.innerHTML = ''; // Limpiar el contenedor antes de agregar nuevos elementos
                data.forEach(video => {
                    const videoElement = document.createElement('div');
                    videoElement.className = 'videoThumbnail';
                    videoElement.style.backgroundColor = 'var(--tertiary-color)';
                    videoElement.innerHTML = `
                        <img src="${video.thumbnail}" onclick="openVideo('${video.manifest}', '${video.title}', \`${video.description}\`)" style="width: 100%; height: auto; cursor: pointer;">
                        <p><strong>${video.title}</strong></p>
                    `;
                    videoContainer.appendChild(videoElement);
                });
            } else {
                // Mostrar mensaje si no hay videos
                noVideosMessage.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error cargando los videos:', error);
            document.getElementById('noVideosMessage').style.display = 'block';
        });
}

// Función para abrir el modal del reproductor de video
function openVideo(url, title, description) {
    const videoPlayer = document.getElementById('videoPlayer');
    const videoTitleDisplay = document.getElementById('videoTitleDisplay');
    const videoDescriptionDisplay = document.getElementById('videoDescriptionDisplay');
    const videoPlayerModal = document.getElementById('videoPlayerModal');

    // Usar Shaka Player para reproducir el video
    const player = new shaka.Player(videoPlayer);

    player.load(url).then(() => {
        console.log('El video ha sido cargado correctamente');
    }).catch(error => {
        console.error('Error cargando el video:', error);
    });

    // Mostrar detalles del video en el modal
    videoTitleDisplay.textContent = title;
    videoDescriptionDisplay.textContent = description;

    // Mostrar el modal del reproductor de video
    videoPlayerModal.classList.remove('hidden');
    videoPlayerModal.style.display = 'flex'; // Asegúrate de establecer el display a 'flex'
}

// Función para cerrar el modal del reproductor de video
function closeVideoPlayer() {
    const videoPlayerModal = document.getElementById('videoPlayerModal');
    const videoPlayer = document.getElementById('videoPlayer');

    // Pausar y reiniciar el video
    videoPlayer.pause();
    videoPlayer.currentTime = 0;

    // Ocultar el modal del reproductor de video
    videoPlayerModal.classList.add('hidden');
    videoPlayerModal.style.display = 'none';
}
