# Politica de Privacidad - AI Prompt Vault

Ultima actualizacion: 26 de mayo de 2026

## Finalidad de la extension

AI Prompt Vault es una extension de Chrome que permite guardar y organizar prompts por modelo de IA, copiar texto o URLs desde la pestana activa, guardar una memoria local y combinar esa memoria con prompts definidos por el usuario.

## Datos que puede procesar

La extension puede procesar los siguientes datos cuando el usuario realiza una accion explicita:

- Texto seleccionado en la pestana activa.
- URL de la pestana activa.
- Texto disponible en el portapapeles cuando el usuario usa funciones como guardar memoria o unir prompt + dato.
- Prompts, modelos, URLs de modelos e imagenes referenciales agregadas manualmente por el usuario.

Estos datos se usan exclusivamente para la funcionalidad principal de la extension: organizar, copiar, guardar y combinar prompts.

## Almacenamiento de datos

AI Prompt Vault almacena datos localmente usando `chrome.storage.local`.

Los datos pueden incluir:

- Modelos configurados por el usuario.
- Prompts guardados.
- Imagenes referenciales embebidas en prompts.
- Modelo y prompt activos.
- Memoria persistente guardada por el usuario.

La extension no envia estos datos a servidores propios ni a bases de datos externas.

## Comparticion de datos

AI Prompt Vault no vende, alquila ni transfiere datos de usuario a terceros.

La extension no usa datos de usuario para publicidad, analiticas externas, perfilado, seguimiento ni decisiones crediticias.

El usuario puede copiar manualmente contenido generado por la extension y pegarlo en servicios externos de IA. Esa accion ocurre bajo control del usuario y fuera del almacenamiento interno de la extension.

## Permisos de Chrome

La extension solicita permisos para:

- Leer temporalmente la pestana activa cuando el usuario copia una seleccion o usa la URL actual.
- Leer y escribir en el portapapeles cuando el usuario ejecuta acciones de copia, memoria o combinacion de prompts.
- Guardar datos localmente con `chrome.storage.local`.
- Abrir sitios de modelos de IA configurados por el usuario.
- Mostrar la interfaz en el side panel de Chrome.

## Codigo remoto

La extension no ejecuta codigo JavaScript remoto ni WebAssembly remoto. Todo el codigo ejecutable esta incluido en el paquete de la extension.

## Seguridad y control del usuario

Los datos guardados permanecen en el navegador del usuario. El usuario puede editar o eliminar prompts, modelos, imagenes y memoria desde la interfaz de la extension.

## Contacto

Para preguntas sobre esta politica de privacidad, contacta al desarrollador mediante la informacion publicada en la ficha de Chrome Web Store.
