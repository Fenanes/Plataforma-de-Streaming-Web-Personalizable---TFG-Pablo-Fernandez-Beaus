const express = require('express'); // Importar el framework Express para las solicitudes HTTP
const multer = require('multer'); // Importar Multer para manejar la carga de archivos
const { exec } = require('child_process'); // Importar exec para ejecutar comandos en la terminal
const path = require('path'); // Importar path para manejar rutas de archivos
const fs = require('fs'); // Importar fs para manejar el sistema de archivos
const mysql = require('mysql'); // Importar MySQL para interactuar con la base de datos
const app = express(); // Crear una instancia de Express
const port = 3000; // Definir el puerto en el que se ejecutará el servidor
const { v4: uuidv4 } = require('uuid'); // Importar uuid para generar identificadores únicos

// Configuración de multer para manejo de archivos
const upload = multer({
    storage: multer.diskStorage({
        destination: function (req, file, cb) {
            // Definir el destino de los archivos cargados
            if (file.fieldname === 'logo') {
                cb(null, 'logo/'); // Si el archivo es un logo, guardarlo en la carpeta 'logo/'
            } else {
                cb(null, 'uploads/'); // Si el archivo es un video o una miniatura, guardarlo en la carpeta 'uploads/'
            }
        },
        filename: function (req, file, cb) {
            // Definir el nombre del archivo cargado
            if (file.fieldname === 'logo') {
                cb(null, 'logo.png'); // El logo siempre se guarda como 'logo.png'
            } else {
                cb(null, Date.now() + path.extname(file.originalname)); // Generar un nombre único para cada archivo de video o miniatura
            }
        }
    })
});

// Configuración de conexión a la base de datos MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Patricia21',  // Reemplazar con tu contraseña de MySQL
    database: 'VideoPlatform'
});

// Conexión a la base de datos
db.connect((err) => {
    if (err) {
        throw err; // Lanzar un error si no se puede conectar a la base de datos
    }
    console.log('MySQL Connected...'); // Confirmar que la conexión a la base de datos fue exitosa
});

// Configurar Express para servir archivos estáticos desde el directorio actual
app.use(express.static(path.join(__dirname)));
app.use(express.json({ limit: '100mb' })); // Aumentar el límite de tamaño de la carga útil JSON

// Ruta para la página principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); // Enviar el archivo 'index.html' cuando se accede a la raíz del servidor
});

// Ruta para obtener configuraciones
app.get('/settings', (req, res) => {
    let sql = 'SELECT * FROM settings ORDER BY id DESC LIMIT 1'; // Consulta SQL para obtener la última configuración guardada
    db.query(sql, (err, result) => {
        if (err) throw err; // Lanzar un error si la consulta falla
        res.json(result[0]); // Enviar la configuración como respuesta en formato JSON
    });
});

// Ruta para guardar configuraciones, incluyendo logo
app.post('/settings', upload.single('logo'), (req, res) => {
    const { title, subtitle, color, secondaryColor, tertiaryColor, buttonColor, font, fontColor, isItalic, quality } = req.body;
    const isItalicInt = isItalic === 'true' ? 1 : 0; // Convertir el valor de 'isItalic' a un entero
    let logo = req.file ? '/logo/logo.png' : req.body.logo; // Definir la ruta del logo
    let sql = 'INSERT INTO settings (logo, title, subtitle, color, secondaryColor, tertiaryColor, buttonColor, font, fontColor, isItalic, quality) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [logo, title, subtitle, color, secondaryColor, tertiaryColor, buttonColor, font, fontColor, isItalicInt, quality], (err, result) => {
        if (err) throw err; // Lanzar un error si la consulta falla
        res.json({ success: true }); // Enviar una respuesta indicando que la configuración se guardó correctamente
    });
});

// Ruta para obtener todos los videos
app.get('/videos', (req, res) => {
    let sql = 'SELECT * FROM videos'; // Consulta SQL para obtener todos los videos
    db.query(sql, (err, results) => {
        if (err) throw err; // Lanzar un error si la consulta falla
        res.json(results); // Enviar los videos como respuesta en formato JSON
    });
});

// Ruta para subir videos y miniaturas
app.post('/upload', upload.fields([{ name: 'video', maxCount: 10 }, { name: 'thumbnail', maxCount: 1 }]), (req, res) => {
    const videoFiles = req.files['video'];
    const thumbnailFile = req.files['thumbnail'][0];
    const { title, description } = req.body;

    // Obtener la calidad de codificación seleccionada
    let quality = '720p';
    let sql = 'SELECT quality FROM settings ORDER BY id DESC LIMIT 1';
    db.query(sql, (err, result) => {
        if (err) throw err; // Lanzar un error si la consulta falla
        if (result.length > 0 && result[0].quality) {
            quality = result[0].quality; // Establecer la calidad si se encuentra en la configuración
        }

        videoFiles.forEach((videoFile, index) => {
            const inputFile = path.join(__dirname, videoFile.path);
            const outputDir = path.join(__dirname, 'output');
            const mpdDir = path.join(__dirname, 'mpd');
            const uniqueId = uuidv4(); // Generar un identificador único para el video
            const outputSubDir = `${outputDir}/output${uniqueId}`;
            const mpdSubDir = `${mpdDir}/mpd${uniqueId}`;

            fs.mkdirSync(outputSubDir, { recursive: true }); // Crear directorio de salida

            let commands = [
                `ffmpeg -i ${inputFile} -an -c:v libx264 -crf 20 -g 48 -bf 2 -s 1280x720 -b_strategy 0 -sc_threshold 0 -flags +cgop ${outputSubDir}/video_720p.mp4`,
                `ffmpeg -i ${inputFile} -an -c:v libx264 -crf 30 -g 48 -bf 2 -s 960x540 -b_strategy 0 -sc_threshold 0 -flags +cgop ${outputSubDir}/video_540p.mp4`,
                `ffmpeg -i ${inputFile} -an -c:v libx264 -crf 50 -g 48 -bf 2 -s 480x270 -b_strategy 0 -sc_threshold 0 -flags +cgop ${outputSubDir}/video_270p.mp4`,
                `ffmpeg -i ${inputFile} -vn -c:a copy ${outputSubDir}/videoAudio.mp4`
            ];

            // Incluir más resoluciones si la calidad es mayor
            if (quality === '1080p') {
                commands.push(
                    `ffmpeg -i ${inputFile} -an -c:v libx264 -crf 20 -g 48 -bf 2 -s 1920x1080 -b_strategy 0 -sc_threshold 0 -flags +cgop ${outputSubDir}/video_1080p.mp4`
                );
            } else if (quality === '2160p') {
                commands.push(
                    `ffmpeg -i ${inputFile} -an -c:v libx264 -crf 20 -g 48 -bf 2 -s 1920x1080 -b_strategy 0 -sc_threshold 0 -flags +cgop ${outputSubDir}/video_1080p.mp4`,
                    `ffmpeg -i ${inputFile} -an -c:v libx264 -crf 20 -g 48 -bf 2 -s 3840x2160 -b_strategy 0 -sc_threshold 0 -flags +cgop ${outputSubDir}/video_2160p.mp4`
                );
            }

            commands.push(
                `mp4fragment --fragment-duration 2000 ${outputSubDir}/video_720p.mp4 ${outputSubDir}/720_f.mp4`,
                `mp4fragment --fragment-duration 2000 ${outputSubDir}/video_540p.mp4 ${outputSubDir}/540_f.mp4`,
                `mp4fragment --fragment-duration 2000 ${outputSubDir}/video_270p.mp4 ${outputSubDir}/270_f.mp4`,
                `mp4fragment --fragment-duration 2000 ${outputSubDir}/videoAudio.mp4 ${outputSubDir}/audio_f.mp4`
            );

            if (quality === '1080p') {
                commands.push(
                    `mp4fragment --fragment-duration 2000 ${outputSubDir}/video_1080p.mp4 ${outputSubDir}/1080_f.mp4`
                );
            } else if (quality === '2160p') {
                commands.push(
                    `mp4fragment --fragment-duration 2000 ${outputSubDir}/video_1080p.mp4 ${outputSubDir}/1080_f.mp4`,
                    `mp4fragment --fragment-duration 2000 ${outputSubDir}/video_2160p.mp4 ${outputSubDir}/2160_f.mp4`
                );
            }

            let dashCommand = `mp4dash --output-dir=${mpdSubDir} --mpd-name=video.mpd --profiles=on-demand ${outputSubDir}/720_f.mp4 ${outputSubDir}/540_f.mp4 ${outputSubDir}/270_f.mp4 ${outputSubDir}/audio_f.mp4`;
            if (quality === '1080p') {
                dashCommand += ` ${outputSubDir}/1080_f.mp4`;
            } else if (quality === '2160p') {
                dashCommand += ` ${outputSubDir}/1080_f.mp4 ${outputSubDir}/2160_f.mp4`;
            }

            commands.push(dashCommand);

            function runCommands(commands, index = 0) {
                if (index < commands.length) {
                    console.log(`Ejecutando comando: ${commands[index]}`);
                    exec(commands[index], (err, stdout, stderr) => {
                        if (err) {
                            console.error(`Error ejecutando comando: ${commands[index]}`);
                            console.error(stderr);
                            return res.status(500).send('Error procesando el video');
                        }
                        console.log(stdout);
                        runCommands(commands, index + 1); // Ejecutar el siguiente comando
                    });
                } else {
                    console.log('Video procesado exitosamente');
                    const manifestPath = `/mpd/mpd${uniqueId}/video.mpd`;
                    const thumbnailPath = `/uploads/${thumbnailFile.filename}`;

                    let sql = 'UPDATE videos SET manifest = ?, processing = false WHERE title = ?';
                    db.query(sql, [manifestPath, title], (err, result) => {
                        if (err) throw err; // Lanzar un error si la consulta falla
                        res.json({ success: true, manifest: manifestPath, title, description, thumbnail: thumbnailPath });
                    });
                }
            }

            // Insertar video en la base de datos con estado "processing"
            let sql = 'INSERT INTO videos (title, description, thumbnail, manifest, processing) VALUES (?, ?, ?, ?, true)';
            db.query(sql, [title, description, `/uploads/${thumbnailFile.filename}`, '', true], (err, result) => {
                if (err) throw err; // Lanzar un error si la consulta falla
                runCommands(commands); // Iniciar la ejecución de los comandos
            });
        });
    });
});

// Ruta para eliminar un video por título
app.post('/delete', (req, res) => {
    const { title } = req.body;
    let sql = 'SELECT * FROM videos WHERE title = ?';
    db.query(sql, [title], (err, results) => {
        if (err) throw err; // Lanzar un error si la consulta falla
        const video = results[0];
        if (video) {
            const thumbnailPath = path.join(__dirname, video.thumbnail);
            const manifestPath = path.join(__dirname, video.manifest);
            const mpdPath = path.dirname(manifestPath);
            fs.unlinkSync(thumbnailPath); // Eliminar la miniatura del sistema de archivos
            fs.rmdirSync(mpdPath, { recursive: true }); // Eliminar los archivos DASH
            sql = 'DELETE FROM videos WHERE title = ?';
            db.query(sql, [title], (err, result) => {
                if (err) throw err; // Lanzar un error si la consulta falla
                res.json({ success: true }); // Enviar una respuesta indicando que el video fue eliminado
            });
        } else {
            res.status(404).send('Video no encontrado'); // Enviar una respuesta indicando que el video no fue encontrado
        }
    });
});

// Ruta para eliminar todos los videos
app.post('/delete_all_videos', (req, res) => {
    const deleteVideosSql = 'DELETE FROM videos';
    db.query(deleteVideosSql, (err, result) => {
        if (err) {
            console.error('Error eliminando videos de la base de datos:', err);
            return res.status(500).send('Error eliminando videos de la base de datos'); // Enviar una respuesta indicando que hubo un error al eliminar los videos
        }

        const directories = ['uploads', 'mpd', 'output'];

        directories.forEach(directory => {
            const dirPath = path.join(__dirname, directory);
            fs.readdir(dirPath, (err, files) => {
                if (err) {
                    console.error(`Error leyendo el directorio ${directory}:`, err);
                } else {
                    files.forEach(file => {
                        const filePath = path.join(dirPath, file);
                        if (fs.lstatSync(filePath).isDirectory()) {
                            fs.rmdirSync(filePath, { recursive: true }); // Eliminar directorios recursivamente
                        } else {
                            fs.unlinkSync(filePath); // Eliminar archivos
                        }
                    });
                }
            });
        });

        res.json({ success: true }); // Enviar una respuesta indicando que todos los videos fueron eliminados
    });
});

// Ruta para verificar videos procesados
app.get('/check_processed_videos', (req, res) => {
    let sql = 'SELECT id FROM videos WHERE processing = false AND processed = false'; // Consulta SQL para obtener videos que no están procesando y no están marcados como procesados
    db.query(sql, (err, results) => {
        if (err) throw err; // Lanzar un error si la consulta falla
        res.json(results); // Enviar los resultados como respuesta en formato JSON
    });
});

// Ruta para marcar videos como procesados
app.post('/mark_videos_processed', (req, res) => {
    const videoIds = req.body.videoIds;
    let sql = 'UPDATE videos SET processed = true WHERE id IN (?)'; // Consulta SQL para marcar videos como procesados
    db.query(sql, [videoIds], (err, result) => {
        if (err) throw err; // Lanzar un error si la consulta falla
        res.json({ success: true }); // Enviar una respuesta indicando que los videos fueron marcados como procesados
    });
});

// Iniciar el servidor
app.listen(port, () => {
    console.log(`Servidor de video escuchando en http://localhost:${port}`); // Confirmar que el servidor está escuchando en el puerto especificado
});
