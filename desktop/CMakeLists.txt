# sudo apt install \
# qt6-base-dev \
# qt6-webengine-dev \
# qt6-webengine-dev-tools \
# libqt6webenginecore6-bin
# libglx-dev libgl1-mesa-dev

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
        REQUIRED)

add_executable(kaiten main.cpp resources.qrc
        Application.cpp
        Application.h
        CustomWebEnginePage.cpp
        CustomWebEnginePage.h
)

target_link_libraries(kaiten
        Qt::Core
        Qt::Gui
        Qt::Widgets
        Qt::WebEngineWidgets
        Qt::WebChannel
)

set_target_properties(
        kaiten
        PROPERTIES
        RUNTIME_OUTPUT_DIRECTORY ${CMAKE_BINARY_DIR}/bin
)

if (WIN32)
    if(CMAKE_BUILD_TYPE STREQUAL "Release")
        set_property(TARGET kaiten PROPERTY WIN32_EXECUTABLE true)
    endif()

    set(QT_ROOT_DIR "$ENV{QT_ROOT_DIR}")

    add_custom_command(
            TARGET kaiten POST_BUILD
            COMMAND ${QT_ROOT_DIR}/bin/windeployqt $<TARGET_FILE:kaiten>
            COMMENT "Deploying QT modules"
            VERBATIM
    )
endif()
