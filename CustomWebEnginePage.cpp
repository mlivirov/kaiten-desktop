#include "CustomWebEnginePage.h"

bool CustomWebEnginePage::acceptNavigationRequest(const QUrl &url, QWebEnginePage::NavigationType type, bool isMainFrame) {
    if (type == QWebEnginePage::NavigationTypeLinkClicked) {
        qInfo() << "opening link:" << url;
        QDesktopServices::openUrl(url);
        return false;
    }

    return true;
}
