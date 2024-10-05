# Настройка и использование
## Как обычный веб сайт (Self Hosted)
:::info
При таком варианте использования, при авторизации, необходимо указывать адреса прокси вместо оригинальных адресов Kaiten API.
:::

### Docker

Самый простой способ развертывания это использование готового [Docker образа](https://hub.docker.com/r/mlivirov/kaiten-client).

Пример использования: 
```bash
docker run -p 8080:80 -e NGINX_PORT=80 -e KAITEN_HOST=your_organization.kaiten.ru -e KAITEN_FILES=files.kaiten.ru mlivirov/kaiten-client
```

### Детали
Сервер Kaiten ограничивает использования API для браузеров используя CORS заголовки.

Для обхода этого ограничения требуется настроить forward proxy через nginx сервер. Этот же сервер можно использовать для хостинга самого PWA приложения.

## Как мобильный клиент
Ничего дополнительно настраивать не нужно, т.к. клиент напрямую использует API Kaiten с вашего устройства. Просто скачайте и установите приложение.

### Для Android
Скачайте и установите APK файл со страницы проекта в [GitHub](https://github.com/mlivirov/kaiten-desktop/releases).

### Для iOS
::: warning
Извините, но эта платформа временно не поддерживается. 
:::

## Как приложение для ПК
Ничего дополнительно настраивать не нужно, т.к. клиент напрямую использует API Kaiten с вашего устройства. Просто скачайте и установите приложение.

### Для Windows
- Скачайте архив со сборкой со страницы проекта в [GitHub](https://github.com/mlivirov/kaiten-desktop/releases). 
- Разархивируйте в любое место на диске.
- Создайте ярлык для kaiten.exe на рабочем столе.

### Для Linux
- Скачайте сборку со страницы проекта в [GitHub](https://github.com/mlivirov/kaiten-desktop/releases).
- Установите следующие зависимости в систему:
  - qt6-base
  - qt6-webengine
- Создайте /usr/share/applications/kaiten.desktop для быстро запуска (только для Ubuntu Gnome).

```ini
[Desktop Entry]
Version=1.0
Type=Application
Name=Kaiten
GenericName=Kaiten
Comment=Kaiten Task manager
Keywords=kaiten;task manager;
Exec=/opt/kaiten/kaiten
Icon=/opt/kaiten/favicon.ico
Terminal=false
Categories=Tools;Utility;
StartupNotify=true
```

### Для Mac
::: warning
Извините, но эта платформа временно не поддерживается.
:::