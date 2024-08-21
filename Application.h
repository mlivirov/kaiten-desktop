#ifndef KAITEN_APPLICATION_H
#define KAITEN_APPLICATION_H

#include <QObject>
#include <QWebEngineView>
#include <QString>
#include <QWebChannel>
#include <QSettings>
#include <QNetworkAccessManager>
#include <QNetworkDiskCache>

class Application : public QObject {
    Q_OBJECT

signals:
    void httpRequestReady(const QString& requestId, const int statusCode, const QString& data);

private:
    static const QString LOCALHOST_API_PATH;
    static const QString LOCALHOST_FILE_PATH;
    static const QString SETTINGS_PATH;

public slots:
    size_t httpRequest(const QString& method, const QString& url, const QString& data);
    void processHttpResponse(QNetworkReply *reply);

public:
    Application();

private:
    size_t httpApiRequest(const QString& method, const QString& url, const QString& data);
    size_t httpFileRequest(const QString& method, const QString& url, const QString& data);
    size_t httpSettingsRequest(const QString& method, const QString& path, const QString& data);

private:
    QScopedPointer<QWebEngineView> _webEngineView;
    QScopedPointer<QWebChannel> _webChannel;
    QScopedPointer<QSettings> _settings;
    QScopedPointer<QNetworkAccessManager> _networkAccessManager;
    QScopedPointer<QNetworkDiskCache> _networkDiskCache;
};


#endif //KAITEN_APPLICATION_H
