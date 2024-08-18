#include <QApplication>
#include <QPushButton>
#include <QWebEngineView>
#include <QResource>
#include <QFile>
#include <qt6/QtWidgets/QApplication>
#include "Application.h"

int main(int argc, char *argv[]) {
    QApplication a(argc, argv);
    Application app;

    return QApplication::exec();
}
