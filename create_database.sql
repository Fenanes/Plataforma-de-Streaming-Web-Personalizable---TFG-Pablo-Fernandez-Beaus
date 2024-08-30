-- Crear la base de datos VideoPlatform
CREATE DATABASE IF NOT EXISTS VideoPlatform;

-- Usar la base de datos VideoPlatform
USE VideoPlatform;

-- Crear la tabla settings
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    logo TEXT,
    color VARCHAR(255),
    secondaryColor VARCHAR(255),
    tertiaryColor VARCHAR(255),
    title VARCHAR(255),
    subtitle VARCHAR(255),
    font VARCHAR(255),
    fontColor VARCHAR(255),
    isItalic BOOLEAN,
    buttonColor VARCHAR(255),
    quality VARCHAR(10)
);

-- Crear la tabla videos
CREATE TABLE IF NOT EXISTS videos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    thumbnail VARCHAR(255),
    manifest VARCHAR(255) NOT NULL,
    processing BOOLEAN DEFAULT false,
    processed BOOLEAN DEFAULT false
);
