window.addEventListener('DOMContentLoaded', () => {
    // Obtener configuraciones de personalización desde el servidor al cargar la página
    fetch('/settings')
        .then(response => response.json())
        .then(settings => {
            const logoImage = document.getElementById('logoImage');
            const titleContainer = document.getElementById('titleContainer');
            const subtitleContainer = document.getElementById('subtitleContainer');
            document.body.style.setProperty('--primary-color', settings.color || '#00BFFF');
            document.body.style.setProperty('--secondary-color', settings.secondaryColor || '#FFFFFF');
            document.body.style.setProperty('--tertiary-color', settings.tertiaryColor || '#FFFFFF');
            document.body.style.setProperty('--button-color', settings.buttonColor || '#007BFF');
            document.body.style.fontFamily = settings.font || 'Arial';
            document.body.style.color = settings.fontColor || '#000';
            document.body.style.fontStyle = settings.isItalic ? 'italic' : 'normal';
            
            // Si hay un logo guardado, mostrarlo en la página
            if (settings.logo) {
                logoImage.src = settings.logo;
                document.getElementById('logoPreview').src = settings.logo;
                document.getElementById('logoPreview').style.display = 'block';
            }
            titleContainer.textContent = settings.title || 'Plataforma de Streaming';
            subtitleContainer.textContent = settings.subtitle || '';

            // Guardar configuraciones actuales en variables globales para usarlas al abrir el modal
            window.currentSettings = settings;

            // Iniciar polling para verificar videos procesados
            checkProcessedVideos();
        })
        .catch(error => {
            console.error('Error al cargar las configuraciones:', error);
        });

    document.getElementById('uploadButton').addEventListener('click', openModal);
    loadVideos();
});

// Función para agregar videos
function addVideos() {
    const videoUploader = document.getElementById('videoUploader');
    const thumbnailUploader = document.getElementById('thumbnailUploader');
    const title = document.getElementById('videoTitle').value;
    const description = document.getElementById('videoDescription').value;
    const errorMessage = document.getElementById('errorMessage');

    // Verificar que todos los campos obligatorios estén completos
    if (videoUploader.files.length === 0 || thumbnailUploader.files.length === 0 || title === '') {
        errorMessage.classList.remove('hidden');
        return;
    } else {
        errorMessage.classList.add('hidden');
    }

    const formData = new FormData();
    Array.from(videoUploader.files).forEach(file => {
        formData.append('video', file);
    });
    formData.append('thumbnail', thumbnailUploader.files[0]);
    formData.append('title', title);
    formData.append('description', description);

    // Enviar datos al servidor
    fetch('/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        location.reload(); // Recargar la página después de agregar el video
    })
    .catch(error => {
        console.error('Error subiendo el video:', error);
    });

    closeModal();
}

// Función para cargar los videos desde el servidor
function loadVideos() {
    fetch('/videos')
        .then(response => response.json())
        .then(data => {
            const videoContainer = document.getElementById('videosDisplay');
            const noVideosMessage = document.getElementById('noVideosMessage');

            // Mostrar los videos si hay alguno
            if (data.length > 0) {
                noVideosMessage.style.display = 'none';
                videoContainer.innerHTML = '';
                data.forEach(video => {
                    const videoElement = document.createElement('div');
                    videoElement.className = 'videoThumbnail';
                    if (video.processing) {
                        videoElement.innerHTML = `
                            <img src="${video.thumbnail}" style="width: 100%; height: auto; cursor: pointer;">
                            <p><strong>${video.title}</strong></p>
                            <p>En proceso...</p>
                        `;
                    } else {
                        videoElement.innerHTML = `
                            <img src="${video.thumbnail}" onclick="openVideo('${video.manifest}', '${video.title}', \`${video.description}\`)" style="width: 100%; height: auto; cursor: pointer;">
                            <p><strong>${video.title}</strong></p>
                        `;
                    }
                    videoContainer.appendChild(videoElement);
                });
            } else {
                noVideosMessage.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Error cargando los videos:', error);
            document.getElementById('noVideosMessage').style.display = 'block';
        });
}

// Función para abrir un video en el reproductor
function openVideo(url, title, description) {
    const videoPlayer = document.getElementById('videoPlayer');
    const videoTitleDisplay = document.getElementById('videoTitleDisplay');
    const videoDescriptionDisplay = document.getElementById('videoDescriptionDisplay');
    const videoPlayerModal = document.getElementById('videoPlayerModal');
    const deleteButton = document.getElementById('deleteButton');

    const player = new shaka.Player(videoPlayer);

    player.load(url).then(() => {
        console.log('El video ha sido cargado correctamente');
    }).catch(error => {
        console.error('Error cargando el video:', error);
    });

    videoTitleDisplay.textContent = title;
    videoDescriptionDisplay.textContent = description;

    deleteButton.onclick = function() {
        openDeleteConfirmationModal(title);
    };

    videoPlayerModal.classList.remove('hidden');
    videoPlayerModal.style.display = 'flex';
}

// Función para cerrar el reproductor de video
function closeVideoPlayer() {
    const videoPlayerModal = document.getElementById('videoPlayerModal');
    const videoPlayer = document.getElementById('videoPlayer');

    videoPlayer.pause();
    videoPlayer.currentTime = 0;

    videoPlayerModal.classList.add('hidden');
    videoPlayerModal.style.display = 'none';
}

// Función para abrir el modal de subida de videos
function openModal() {
    document.getElementById('modal').classList.remove('hidden');
    document.getElementById('modal').style.display = 'flex';
}

// Función para cerrar el modal de subida de videos y recargar la página
function closeModal() {
    document.getElementById('modal').classList.add('hidden');
    document.getElementById('modal').style.display = 'none';

    document.getElementById('videoUploader').value = '';
    document.getElementById('thumbnailUploader').value = '';
    document.getElementById('videoTitle').value = '';
    document.getElementById('videoDescription').value = '';

    setTimeout(function() {
        location.reload();
    }, 500); 
}

// Función para cerrar el modal de subida de videos sin recargar la página
function closeModalCancel() {
    document.getElementById('modal').classList.add('hidden');
    document.getElementById('modal').style.display = 'none';

    document.getElementById('videoUploader').value = '';
    document.getElementById('thumbnailUploader').value = '';
    document.getElementById('videoTitle').value = '';
    document.getElementById('videoDescription').value = '';
}

// Función para abrir el modal de personalización con los valores actuales
function openCustomizationModal() {
    if (window.currentSettings) {
        const settings = window.currentSettings;
        document.getElementById('logoPreview').src = settings.logo;
        document.getElementById('logoPreview').style.display = 'block';
        document.getElementById('primaryColor').value = settings.color || '#00BFFF';
        document.getElementById('secondaryColor').value = settings.secondaryColor || '#FFFFFF';
        document.getElementById('tertiaryColor').value = settings.tertiaryColor || '#FFFFFF';
        document.getElementById('buttonColor').value = settings.buttonColor || '#007BFF';
        document.getElementById('title').value = settings.title || '';
        document.getElementById('subtitle').value = settings.subtitle || '';
        document.getElementById('fontSelector').value = settings.font || 'Arial';
        document.getElementById('fontColor').value = settings.fontColor || '#000';
        document.getElementById('italicCheckbox').checked = settings.isItalic ? true : false;
        document.getElementById('qualitySelector').value = settings.quality || '720p'; // Cargar la calidad seleccionada
    }
    document.getElementById('customizationModal').style.display = 'flex';
}

// Función para cerrar el modal de personalización
function closeCustomizationModal() {
    document.getElementById('customizationModal').style.display = 'none';
}

// Función para previsualizar el logo seleccionado
function previewLogo(event) {
    const logoPreview = document.getElementById('logoPreview');
    const file = event.target.files[0];
    const maxSize = 1 * 1024 * 1024; // 1MB

    if (file.size > maxSize) {
        alert('El tamaño del archivo excede el límite de 1 MB.');
        event.target.value = ''; // Limpiar el input
        return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
        logoPreview.src = reader.result;
        logoPreview.style.display = 'block';
    };

    if (file) {
        reader.readAsDataURL(file);
    } else {
        logoPreview.src = '';
        logoPreview.style.display = 'none';
    }
}

// Función para guardar la personalización
function saveCustomization() {
    const logoUploader = document.getElementById('logoUploader');
    const primaryColor = document.getElementById('primaryColor').value;
    const secondaryColor = document.getElementById('secondaryColor').value;
    const tertiaryColor = document.getElementById('tertiaryColor').value;
    const buttonColor = document.getElementById('buttonColor').value;
    const title = document.getElementById('title').value;
    const subtitle = document.getElementById('subtitle').value;
    const fontSelector = document.getElementById('fontSelector').value;
    const fontColor = document.getElementById('fontColor').value;
    const isItalic = document.getElementById('italicCheckbox').checked;
    const quality = document.getElementById('qualitySelector').value;

    const formData = new FormData();
    if (logoUploader.files.length > 0) {
        formData.append('logo', logoUploader.files[0]);
    }
    formData.append('title', title);
    formData.append('subtitle', subtitle);
    formData.append('color', primaryColor);
    formData.append('secondaryColor', secondaryColor);
    formData.append('tertiaryColor', tertiaryColor);
    formData.append('buttonColor', buttonColor);
    formData.append('font', fontSelector);
    formData.append('fontColor', fontColor);
    formData.append('isItalic', isItalic ? 'true' : 'false');
    formData.append('quality', quality);

    fetch('/settings', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            closeCustomizationModal();
            window.location.reload();
        }
    })
    .catch(error => {
        console.error('Error:', error);
    });
}

// Función para abrir el modal de confirmación de eliminación de video
function openDeleteConfirmationModal(title) {
    const deleteConfirmationModal = document.getElementById('deleteConfirmationModal');
    deleteConfirmationModal.classList.remove('hidden');
    deleteConfirmationModal.style.display = 'flex';

    document.getElementById('confirmDeleteButton').onclick = function() {
        deleteVideo(title);
    };
}

// Función para cerrar el modal de confirmación de eliminación de video
function closeDeleteConfirmationModal() {
    const deleteConfirmationModal = document.getElementById('deleteConfirmationModal');
    deleteConfirmationModal.classList.add('hidden');
    deleteConfirmationModal.style.display = 'none';
}

// Función para eliminar un video
function deleteVideo(title) {
    fetch('/delete', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload(); // Recargar la página después de eliminar el video
        } else {
            console.error('Error eliminando el video');
        }
    })
    .catch(error => {
        console.error('Error eliminando el video:', error);
    });
}

// Función para abrir el modal de confirmación de eliminación de todos los videos
function openDeleteVideosConfirmationModal() {
    const deleteVideosConfirmationModal = document.getElementById('deleteVideosConfirmationModal');
    deleteVideosConfirmationModal.classList.remove('hidden');
    deleteVideosConfirmationModal.style.display = 'flex';

    document.getElementById('confirmDeleteVideosButton').onclick = function() {
        deleteAllVideos();
    };
}

// Función para cerrar el modal de confirmación de eliminación de todos los videos
function closeDeleteVideosConfirmationModal() {
    const deleteVideosConfirmationModal = document.getElementById('deleteVideosConfirmationModal');
    deleteVideosConfirmationModal.classList.add('hidden');
    deleteVideosConfirmationModal.style.display = 'none';
}

// Función para eliminar todos los videos
function deleteAllVideos() {
    fetch('/delete_all_videos', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            location.reload(); // Recargar la página después de eliminar todos los videos
        } else {
            console.error('Error eliminando los videos');
        }
    })
    .catch(error => {
        console.error('Error eliminando los videos:', error);
    });
}

// Función para verificar videos procesados periódicamente
function checkProcessedVideos() {
    setInterval(() => {
        fetch('/check_processed_videos')
            .then(response => response.json())
            .then(data => {
                if (data.length > 0) {
                    const videoIds = data.map(video => video.id);
                    fetch('/mark_videos_processed', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ videoIds })
                    })
                    .then(response => response.json())
                    .then(result => {
                        if (result.success) {
                            location.reload();
                        }
                    })
                    .catch(error => {
                        console.error('Error al marcar videos como procesados:', error);
                    });
                }
            })
            .catch(error => {
                console.error('Error verificando videos procesados:', error);
            });
    }, 5000); // Verificar cada 5 segundos
}
