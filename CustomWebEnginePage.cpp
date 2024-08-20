#include "CustomWebEnginePage.h"

bool CustomWebEnginePage::acceptNavigationRequest(const QUrl &url, QWebEnginePage::NavigationType type, bool isMainFrame) {
    if (type == QWebEnginePage::NavigationTypeLinkClicked)
    {
        QDesktopServices::openUrl(QUrl(url));
        return false;
    }

    return true;
}
