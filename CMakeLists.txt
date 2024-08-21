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

add_custom_command(TARGET kaiten POST_BUILD
        COMMAND ${CMAKE_COMMAND} -E copy_if_different $<TARGET_FILE:Qt6::Core> $<TARGET_FILE_DIR:kaiten>
        COMMAND ${CMAKE_COMMAND} -E copy_if_different $<TARGET_FILE:Qt6::Gui> $<TARGET_FILE_DIR:kaiten>
        COMMAND ${CMAKE_COMMAND} -E copy_if_different $<TARGET_FILE:Qt6::Widgets> $<TARGET_FILE_DIR:kaiten>
        COMMAND ${CMAKE_COMMAND} -E copy_if_different $<TARGET_FILE:Qt6::WebEngineWidgets> $<TARGET_FILE_DIR:kaiten>
        COMMAND ${CMAKE_COMMAND} -E copy_if_different $<TARGET_FILE:Qt6::WebChannel> $<TARGET_FILE_DIR:kaiten>
        COMMAND ${CMAKE_COMMAND} -E copy_if_different $<TARGET_FILE:Qt6::Network> $<TARGET_FILE_DIR:kaiten>
        COMMAND ${CMAKE_COMMAND} -E copy_if_different $<TARGET_FILE:Qt6::WebEngineCore> $<TARGET_FILE_DIR:kaiten>
        COMMAND ${CMAKE_COMMAND} -E copy_if_different $<TARGET_FILE:Qt6::Qml> $<TARGET_FILE_DIR:kaiten>
        COMMAND ${CMAKE_COMMAND} -E copy_if_different $<TARGET_FILE:Qt6::Quick> $<TARGET_FILE_DIR:kaiten>
        COMMAND ${CMAKE_COMMAND} -E copy_if_different $<TARGET_FILE:Qt6::PrintSupport> $<TARGET_FILE_DIR:kaiten>
        COMMAND ${CMAKE_COMMAND} -E copy_if_different $<TARGET_FILE:Qt6::OpenGL> $<TARGET_FILE_DIR:kaiten>
        COMMAND ${CMAKE_COMMAND} -E copy_if_different $<TARGET_FILE:Qt6::QuickWidgets> $<TARGET_FILE_DIR:kaiten>
        COMMAND ${CMAKE_COMMAND} -E copy_if_different $<TARGET_FILE:Qt6::QmlModels> $<TARGET_FILE_DIR:kaiten>
        COMMAND ${CMAKE_COMMAND} -E copy_if_different $<TARGET_FILE:Qt6::Positioning> $<TARGET_FILE_DIR:kaiten>
)

if (WIN32)
    set(QT_PLUGIN_PATH "$ENV{QT_PLUGIN_PATH}")
    set(QT_ROOT_DIR "$ENV{QT_ROOT_DIR}")

    find_file(
            QWINDOWS
            NAMES qwindows.dll
            PATHS ${QT_PLUGIN_PATH}/platforms
            REQUIRED
    )

    find_file(
            QT_WEB_ENGINE
            NAMES QtWebEngineProcess.exe
            REQUIRED
    )

    add_custom_target(PLATFORMS ALL COMMAND
            COMMAND ${CMAKE_COMMAND} -E make_directory $<TARGET_FILE_DIR:kaiten>/platforms
            COMMAND ${CMAKE_COMMAND} -E make_directory $<TARGET_FILE_DIR:kaiten>/resources
            COMMAND ${CMAKE_COMMAND} -E make_directory $<TARGET_FILE_DIR:kaiten>/translations/qtwebengine_locales
    )

    add_custom_command(
            TARGET kaiten POST_BUILD
            COMMAND ${CMAKE_COMMAND} -E copy_if_different ${QWINDOWS} $<TARGET_FILE_DIR:kaiten>/platforms
            COMMAND ${CMAKE_COMMAND} -E copy_if_different ${QT_WEB_ENGINE} $<TARGET_FILE_DIR:kaiten>
            COMMAND ${CMAKE_COMMAND} -E copy_directory ${QT_ROOT_DIR}/translations/qtwebengine_locales $<TARGET_FILE_DIR:kaiten>/translations/qtwebengine_locales
            COMMAND ${CMAKE_COMMAND} -E copy_directory ${QT_ROOT_DIR}/resources $<TARGET_FILE_DIR:kaiten>/resources
    )
endif()
