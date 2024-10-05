# Kaiten Task Manager Clients

## References

http://kaiten-client.ru

http://kaiten.ru

## Overview

Welcome to the Kaiten Client project! This repository provides enhanced desktop and mobile applications for Kaiten, featuring a completely new user interface designed to improve usability and streamline your task management experience.

This implementation leverages the latest technologies to deliver a modern and responsive design:

- **UI Framework**: Built with [Angular 17](https://angular.io/), offering a dynamic and responsive user experience.
- **Desktop Application**: Uses [Qt 6](https://doc.qt.io/qt-6/) WebView wrapper for Progressive Web Apps (PWA), combining the power of modern web technologies with native desktop capabilities.
- **Mobile Application**: Developed using [Capacitor](https://capacitorjs.com/), allowing seamless integration with mobile platforms (iOS and Android) while leveraging web-based technologies.

### Compiling from source

1. Install all build tools (NodeJS, NVM, CMake, C++ Compiler, Qt libraries)
2. Open terminal in project directory

### Compile PWA
1. nvm use 18
2. npm install
3. npm run build

### Compile Desktop Client
1. mkdir build
3. cd build
4. cmake -DCMAKE_BUILD_TYPE=Release ..
5. cmake --build .

## Contributing

We welcome contributions to improve the Kaiten Task Manager Clients project! To contribute:

1. **Fork the Repository**: Click the “Fork” button on GitHub to create your own copy of the project.
2. **Create a Branch**: Work on your changes in a separate branch.
3. **Submit a Pull Request**: Open a pull request with a description of your changes for review.

## License

This project is licensed under the [GNU Lesser General Public License (LGPL)](LICENSE.md). See the LICENSE file for more details.

## Contact

For any questions or support, please contact me at [max.livirov@gmail.com](mailto:max.livirov@gmail.com) or open an issue in the repository.
