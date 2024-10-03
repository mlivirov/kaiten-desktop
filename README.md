# Kaiten Task Manager Clients

## Overview

Welcome to the Kaiten Task Manager Clients project! This repository provides enhanced desktop and mobile applications for Kaiten Task Manager, featuring a completely new user interface designed to improve usability and streamline your task management experience.

This implementation leverages the latest technologies to deliver a modern and responsive design:

- **UI Framework**: Built with [Angular 17](https://angular.io/), offering a dynamic and responsive user experience.
- **Desktop Application**: Uses [Qt 6](https://doc.qt.io/qt-6/) WebView wrapper for Progressive Web Apps (PWA), combining the power of modern web technologies with native desktop capabilities.
- **Mobile Application**: Developed using [Capacitor](https://capacitorjs.com/), allowing seamless integration with mobile platforms (iOS and Android) while leveraging web-based technologies.

## Features

- **Enhanced User Interface**: A modern and intuitive design for both desktop and mobile platforms.
- **Cross-Platform Support**: Native clients for Windows, macOS, Linux, iOS, and Android.
- **Seamless Integration**: Directly interacts with the Kaiten API for real-time data synchronization.
- **Customizable Views**: Tailor the interface to fit your workflow preferences.

#### Board view
![Screenshot from 2024-08-22 01-24-07](https://github.com/user-attachments/assets/84424da4-fa10-424f-8de0-8386efa62baf)

#### Global search
![image](https://github.com/user-attachments/assets/6b00d656-cd78-405f-8b7b-0d1e6d100821)

## Feature comparison tables

### General
| Feature            | Official Kaiten UI | This project   |
|--------------------|--------------------|----------------|
| Spaces             | +                  | -              |
| Boards             | -                  | +              |
| Lanes              | +                  | +/-            |
| Card               | +                  | +              |
| Global card search | -                  | +              |
| Board search       | -                  | +              |
| Column WIP limits  | +                  | +              |
| Lane WIP limits    | +                  | -              |
| Responsive UI      | -                  | +              |
| Live boards        | + (instant)        | -              |
| Mass updates       | +                  | in development |

### Card
| Feature                           | Official Kaiten UI | This Project    |
|-----------------------------------|--------------------|-----------------|
| Create card in modal dialog       | -                  | +               |
| View/Edit card in a separate page | -                  | +               |
| Comments                          | +                  | +               |
| Card activity history             | +/-                | +               |
| Throughput report                 | +                  | +               |
| Checklists                        | +                  | +               |
| Markdown editor                   | +/-                | +               |
| Links                             | +                  | -               |
| Relative cards                    | +/-                | in development  |
| Attachments                       | +                  | in development  |

### Checklist
| Feature                     | Official Kaiten UI | This Project |
|-----------------------------|--------------------|--------------|
| Checks                      | +                  | +            |
| Due date                    | +                  | +            |
| Responsible                 | +                  | +            |
| Markdown                    | +/-                | +            |

### Custom properties
| Feature              | Official Kaiten UI | This Project |
|----------------------|--------------------|--------------|
| Checkbox             | +                  | +            |
| Date                 | +                  | +            |
| Line                 | +                  | +            |
| Email                | +                  | +            |
| Link                 | +                  | +            |
| Phone                | +                  | +            |
| Number               | +                  | +            |
| Single User          | +                  | +            |
| Multi User           | +                  | -            |
| Select (predefined)  | +                  | +            |
| Select (user values) | +                  | +            |
| Multiselect          | +                  | -            |
| File                 | +                  | -            |
| Formula              | +                  | -            |
| Votes                | +                  | -            |
| Group assessment     | +                  | -            |

### Makrdown Features
| Feature             | Official Kaiten UI | This Project |
|---------------------|--------------------|--------------|
| Mentions            | +                  | +            |
| Links to cards      | +/-                | +            |
| Visual editor       | +                  | +            |
| Raw markdown editor | +/-                | +            |


## Getting Started

### Prerequisites

- **Kaiten Account**: Ensure you have an active Kaiten Task Manager account.
- **API Key**: Obtain your personal API key from Kaiten’s portal (http[s]://kaiten.organization.com/profile/api-key)

### Installation (not yet available)

#### Desktop Clients

1. **Download**: Visit the [Releases page](link-to-releases) to download the installer for your operating system.
2. **Install**: Follow the installation instructions for your OS:
   - **Windows**: Run the `.exe` installer and follow the on-screen prompts.
   - **Linux**: Download the `.AppImage` or `.deb` file and install it using your package manager or run it directly.

#### Mobile Clients

1. **Download**: Search for “Kaiten Task Manager” in the [Google Play Store](link-to-play-store).
2. **Install**: Follow the standard app installation process for your device.

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


### Configuration

1. **Open the Application**: Launch the application on your desktop or mobile device.
2. **API URL**: Enter your server API URL.
3. **FILES URL**: Enter your server Files URL.
4. **API Key**: Enter your API key in the settings to connect with Kaiten’s services.

### Usage

- **Create and Manage Tasks**: Use the redesigned interface to add, update, and organize your tasks.
- **Customize Views**: Adjust settings to personalize your task management experience.
- **Sync with Kaiten**: Changes made in the application will sync with your Kaiten account in real-time.

## Contributing

We welcome contributions to improve the Kaiten Task Manager Clients project! To contribute:

1. **Fork the Repository**: Click the “Fork” button on GitHub to create your own copy of the project.
2. **Create a Branch**: Work on your changes in a separate branch.
3. **Submit a Pull Request**: Open a pull request with a description of your changes for review.

## License

This project is licensed under the [MIT License](LICENSE). See the LICENSE file for more details.

## Contact

For any questions or support, please contact us at [max.livirov@gmail.com](mailto:your-email@example.com) or open an issue in the repository.
