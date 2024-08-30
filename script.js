document.addEventListener('DOMContentLoaded', function() {
    const welcomeScreen = document.getElementById('welcomeScreen');
    
    // Mostrar la pantalla de bienvenida durante 3 segundos antes de comenzar la animación de desvanecimiento
    setTimeout(function() {
        welcomeScreen.style.animation = 'fadeOut 3s forwards';
        
        // Después de que la animación de desvanecimiento termine, ocultar la pantalla de bienvenida y mostrar el formulario de personalización
        setTimeout(function() {
            welcomeScreen.style.display = 'none';
            document.getElementById('formContainer').style.display = 'flex';
            showStep(1); // Mostrar el primer paso del formulario de personalización
        }, 3000);
    }, 3000);
});

// Función para mostrar un paso específico del formulario de personalización
function showStep(stepNumber) {
    const steps = document.querySelectorAll('.step');
    steps.forEach(step => {
        step.style.display = 'none'; // Ocultar todos los pasos
    });
    document.getElementById('step' + stepNumber).style.display = 'flex'; // Mostrar el paso actual
}

// Función para cambiar de paso en el formulario de personalización
function changeStep (stepNumber) {
    showStep(stepNumber);
}


// Función para previsualizar el logo seleccionado
function previewLogo(event) {
    const [file] = event.target.files;
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const logoPreview = document.getElementById('logoPreview');
            logoPreview.src = e.target.result; // Establecer la imagen del logo en la vista previa
            logoPreview.style.display = 'block'; // Mostrar la vista previa del logo
        };
        reader.readAsDataURL(file); // Leer el archivo como una URL de datos
    }
}

// Función para guardar las configuraciones seleccionadas y redirigir a la página de la plataforma
function saveSettings() {
    const formContainer = document.getElementById('formContainer');
    formContainer.style.animation = 'fadeOut 3s forwards'; // Inicia la animación de desvanecimiento

    // Usar setTimeout para esperar a que la animación termine antes de ejecutar el código de redirección
    setTimeout(() => {
        const logoUploader = document.getElementById('logoUploader');
        const primaryColor = document.getElementById('primaryColor').value;
        const secondaryColor = document.getElementById('secondaryColor').value;
        const tertiaryColor = document.getElementById('tertiaryColor').value;
        const title = document.getElementById('title').value;
        const subtitle = document.getElementById('subtitle').value;
        const fontSelector = document.getElementById('fontSelector').value;
        const fontColor = document.getElementById('fontColor').value;
        const isItalic = document.getElementById('italicCheckbox').checked;
        const buttonColor = document.getElementById('buttonColor').value;
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
        formData.append('font', fontSelector);
        formData.append('fontColor', fontColor);
        formData.append('isItalic', isItalic ? 'true' : 'false');
        formData.append('buttonColor', buttonColor);
        formData.append('quality', quality);

        fetch('/settings', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                window.location.href = 'platform_admin.html'; // Redireccionar a la plataforma de streaming
            } else {
                console.error('Error al guardar las configuraciones');
            }
        })
        .catch(error => {
            console.error('Error al guardar las configuraciones:', error);
        });
    }, 3000); // Ajusta el tiempo al mismo de la animación de desvanecimiento
}
