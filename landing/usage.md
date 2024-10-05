# Настройка и использование
## Как обычный веб сайт
Сервер Kaiten ограничивает использования API для браузеров используя CORS заголовки.

Для обхода этого ограничения требуется настроить forward proxy через nginx сервер. Этот же сервер можно использовать для хостинга самого PWA приложения.

:::info
При таком варианте использования, при авторизации, необходимо указывать адреса прокси вместо оригинальных адресов Kaiten.
:::

Пример docker-compose.yml
```yaml
services:
  web:
    image: nginx
    ports:
      - 8080:80
    volumes:
      - ./server/templates:/etc/nginx/templates
      - ../pwa/dist/pwa/browser:/usr/share/nginx/html
    environment:
      - NGINX_PORT=80
      - KAITEN_HOST=${KAITEN_HOST}
      - KAITEN_FILES=${KAITEN_FILES}
```

Пример nginx templates/default.conf.template
```nginx
server {
    large_client_header_buffers 4 32k;
    listen       ${NGINX_PORT};
    error_page 404 = @fallback;

    location ~ ^/api/(.*) {
        resolver 8.8.8.8;
        proxy_pass_request_headers      on;
        proxy_pass https://${KAITEN_HOST}:443${request_uri};

        proxy_hide_header 'Access-Control-Allow-Origin';
        add_header 'Access-Control-Allow-Origin' '*' always;
        add_header 'Access-Control-Allow-Methods' '*' always;
        add_header 'Access-Control-Expose-Headers' '*' always;
        add_header 'X-Original-UI' 'https://${KAITEN_HOST}/' always;
    }

    location ~ ^/files/(.*) {
        resolver 8.8.8.8;
        proxy_pass_request_headers      on;
        proxy_pass https://${KAITEN_FILES}:443/$1;
    }

    location / {
       proxy_set_header Host             $host;
       proxy_set_header X-Real-IP        $remote_addr;

       root   /usr/share/nginx/html;
       try_files $uri $uri/ /index.html;
    }
}
```

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
- Скачайте сборку со страницы проекта.
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