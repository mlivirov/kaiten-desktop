#include "Application.h"
#include "CustomWebEnginePage.h"
#include <QWebChannel>
#include <QWebEngineSettings>
#include <QNetworkReply>
#include <QTimer>
#include <QStandardPaths>
#include <QJsonObject>
#include <QJsonArray>

const QString Application::LOCALHOST_API_PATH{"http://server/api"};
const QString Application::LOCALHOST_FILE_PATH{"http://server/files"};
const QString Application::SETTINGS_PATH{"app://settings#"};

Application::Application():
_webEngineView(new QWebEngineView()),
_webChannel(new QWebChannel()),
_settings(new QSettings("client", "kaiten")),
_networkAccessManager(new QNetworkAccessManager(this)),
_networkDiskCache(new QNetworkDiskCache(this))
{
    auto cacheLocation = QStandardPaths::writableLocation(QStandardPaths::HomeLocation) + "/.kaiten/cache";
    qInfo() << "Cache location:" << cacheLocation;
    _networkDiskCache->setCacheDirectory(cacheLocation);

    _networkAccessManager->setCache(_networkDiskCache.get());

    _webEngineView->setPage(new CustomWebEnginePage(this));
    _webEngineView->settings()->setAttribute(QWebEngineSettings::JavascriptCanOpenWindows, false);
    _webEngineView->settings()->setAttribute(QWebEngineSettings::JavascriptEnabled, true);
    _webEngineView->settings()->setAttribute(QWebEngineSettings::LocalContentCanAccessFileUrls, false);
    _webEngineView->settings()->setAttribute(QWebEngineSettings::LocalContentCanAccessRemoteUrls, false);
    _webEngineView->settings()->setAttribute(QWebEngineSettings::ScrollAnimatorEnabled, true);
    _webEngineView->settings()->setAttribute(QWebEngineSettings::JavascriptCanAccessClipboard, true);
    _webEngineView->settings()->setAttribute(QWebEngineSettings::JavascriptCanPaste, true);

    _webEngineView->page()->setWebChannel(_webChannel.get());

    _webEngineView->load(QUrl("qrc:/index.html"));
    _webChannel->registerObject("proxy", this);

    _webEngineView->setContextMenuPolicy(Qt::PreventContextMenu);
    _webEngineView->resize(1024, 768);
    _webEngineView->show();

    connect(_networkAccessManager.get(), &QNetworkAccessManager::finished, this, &Application::processHttpResponse);
}

void Application::processHttpResponse(QNetworkReply *reply) {
    const auto statusCode = reply->attribute(QNetworkRequest::HttpStatusCodeAttribute).toInt();
    QString data;

    qInfo() << "REQUEST FINISHED:" << reply->url();
    const auto contentType = reply->header(QNetworkRequest::ContentTypeHeader).toString();
    if (contentType.contains("application/json")) {
        data = QString::fromUtf8(reply->readAll());
    } else if (reply->error() != QNetworkReply::NetworkError::NoError) {
        data = reply->errorString();
    } else {
        data = contentType + ":" + QString::fromUtf8(reply->readAll().toBase64());
    }

    QJsonObject headers;
    for (const auto&[name, value] : reply->rawHeaderPairs()) {
        headers[QString::fromUtf8(name)] = QString::fromUtf8(value);
    }

    emit httpRequestReady(QString::number(reinterpret_cast<size_t>(reply)), statusCode, data, headers);
}

void Application::processHttpError(QNetworkReply::NetworkError err) {
    qInfo() << "Network error:" << err;
}

QString Application::httpRequest(const QString &method, const QString &url, const QString &data) {
    if (url.startsWith(LOCALHOST_API_PATH)) {
        const auto apiBaseUrl = _settings->value("API_URL").toString();
        const auto targetUrl = apiBaseUrl + url.mid(LOCALHOST_API_PATH.length());
        return QString::number(httpApiRequest(method, targetUrl, data));
    } else if (url.startsWith(LOCALHOST_FILE_PATH)) {
        const auto filesBaseUrl = _settings->value("FILES_URL").toString();
        const auto targetUrl = filesBaseUrl + url.mid(LOCALHOST_FILE_PATH.length());
        return QString::number(httpFileRequest(method, targetUrl, data));
    } else if (url.startsWith(SETTINGS_PATH)) {
        const auto path = url.mid(SETTINGS_PATH.length());
        return QString::number(httpSettingsRequest(method, path, data));
    }

    throw std::runtime_error(std::string("Non kaiten calls are prohibited, attempted: ") + url.toStdString());
}

size_t Application::httpApiRequest(const QString &method, const QString &url, const QString &data) const {
    QNetworkRequest request(url);

    qInfo() << "REQUEST SENT:" << url;

    const auto token = _settings->value("TOKEN").toString();
    request.setRawHeader("Authorization", ("Bearer " + token).toUtf8());
    request.setHeader(QNetworkRequest::ContentTypeHeader, "application/json");

    if (method == "GET") {
        return reinterpret_cast<size_t>(_networkAccessManager->get(request));
    } else {
        return reinterpret_cast<size_t>(_networkAccessManager->sendCustomRequest(request, method.toUtf8(), data.toUtf8()));
    }
}

size_t Application::httpFileRequest(const QString &method, const QString &url, const QString &data) const {
    QNetworkRequest request(url);
    request.setAttribute(QNetworkRequest::CacheLoadControlAttribute, QNetworkRequest::PreferCache);

    if (method == "GET") {
        return reinterpret_cast<size_t>(_networkAccessManager->get(request));
    } else {
        return reinterpret_cast<size_t>(_networkAccessManager->sendCustomRequest(request, method.toUtf8(), data.toUtf8()));
    }
}

size_t Application::httpSettingsRequest(const QString &method, const QString &path, const QString &data) {
    const auto id = qHash(path);

    if (method == "GET") {
        const auto value = _settings->value(path);

        QTimer::singleShot(0, this, [this, id, path, value] {
            emit httpRequestReady(QString::number(id), 200, value.isNull() ? nullptr : value.toString(), QJsonObject());
        });

        return id;
    } else if (method == "POST") {
        _settings->setValue(path, data);

        QTimer::singleShot(0, this, [this, id, path] {
            emit httpRequestReady(QString::number(id), 200, nullptr, QJsonObject());
        });

        return id;
    }

    throw std::runtime_error("Only get or post is supported");
}