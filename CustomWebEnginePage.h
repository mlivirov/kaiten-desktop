#ifndef KAITEN_CUSTOMWEBENGINEPAGE_H
#define KAITEN_CUSTOMWEBENGINEPAGE_H


#include <QWebEnginePage>
#include <QDesktopServices>

class CustomWebEnginePage : public QWebEnginePage {
public:
    explicit CustomWebEnginePage(QObject *parent = nullptr): QWebEnginePage(parent) {
    }

protected:
    bool acceptNavigationRequest(const QUrl &url, QWebEnginePage::NavigationType type, bool isMainFrame) override;
};


#endif //KAITEN_CUSTOMWEBENGINEPAGE_H
