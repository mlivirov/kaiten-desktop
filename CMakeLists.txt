# sudo apt install \
# qt6-base-dev \
# qt6-webengine-dev \
# qt6-webengine-dev-tools \
# libqt6webenginecore6-bin

cmake_minimum_required(VERSION 3.28)
project(kaiten)


set(CMAKE_CXX_STANDARD 17)
set(CMAKE_AUTOMOC ON)
set(CMAKE_AUTORCC ON)
set(CMAKE_AUTOUIC ON)


find_package(Qt6 COMPONENTS
        Core
        Gui
        Widgets
        WebEngineWidgets
        WebChannel
        WebSockets
        REQUIRED)

add_executable(kaiten main.cpp resources.qrc
        Application.cpp
        Application.h
)
target_link_libraries(kaiten
        Qt::Core
        Qt::Gui
        Qt::Widgets
        Qt::WebEngineWidgets
        Qt::WebChannel
        Qt::WebSockets
)