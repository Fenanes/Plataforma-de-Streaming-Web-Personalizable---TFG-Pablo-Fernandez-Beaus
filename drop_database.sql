-- Usar la base de datos VideoPlatform
USE VideoPlatform;

-- Desactivar restricciones de clave externa
SET FOREIGN_KEY_CHECKS = 0;

-- Eliminar la tabla settings si existe
DROP TABLE IF EXISTS settings;

-- Eliminar la tabla videos si existe
DROP TABLE IF EXISTS videos;


-- Reactivar restricciones de clave externa
SET FOREIGN_KEY_CHECKS = 1;
