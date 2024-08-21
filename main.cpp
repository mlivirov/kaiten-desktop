#include <QApplication>
#include <QPushButton>
#include "Application.h"

int main(int argc, char *argv[]) {
    QApplication a(argc, argv);
    Application app;

    return QApplication::exec();
}
