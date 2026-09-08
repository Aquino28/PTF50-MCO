# 🛡️ CCS Lab Guardian

**CCS Lab Guardian** is a browser-based laboratory monitoring system that uses **real-time object detection** to help monitor laboratory environments. The system uses **TensorFlow.js and the COCO-SSD model** to detect objects through a live webcam feed and identify items that may have been left unattended.

The system is designed to support laboratory monitoring by providing visual detection, object tracking, and unattended-item alerts.

---

## 📌 Features

* 🎥 **Live Webcam Monitoring**
  Uses the device camera to continuously monitor the laboratory environment.

* 🤖 **Real-Time Object Detection**
  Uses the COCO-SSD pre-trained object detection model through TensorFlow.js.

* 🔍 **Object Recognition**
  Detects supported objects within the camera's field of view.

* ⏱️ **Unattended-Item Monitoring**
  Tracks detected items and monitors how long they remain without an associated person.

* 🚨 **Alert System**
  Provides alerts when a monitored object remains unattended for the configured amount of time.

* 📊 **Monitoring Dashboard**
  Displays detected people, objects, alerts, and monitoring information.

* 📝 **Activity History**
  Records important system and monitoring events.

* 🖥️ **Browser-Based**
  Runs directly in a modern web browser without requiring a separate desktop application.

---

## 🎯 Purpose

The primary purpose of CCS Lab Guardian is to assist in monitoring computer laboratory environments.

Instead of relying entirely on manual observation, the system provides an automated way to observe the live camera feed and detect objects that may require attention.

The system is intended as a **monitoring and assistance tool** rather than a replacement for laboratory personnel.

---

## 🧠 How It Works

The system follows this general process:

```text
        ┌─────────────────┐
        │   Live Webcam   │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │   Video Frame   │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │    COCO-SSD     │
        │  Object Detection│
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Detected Objects│
        │   & People      │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Object Tracking │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Unattended Item │
        │    Monitoring   │
        └────────┬────────┘
                 │
                 ▼
        ┌─────────────────┐
        │ Alerts & Status │
        └─────────────────┘
```

### Detection Process

1. The user starts the live webcam.
2. The system accesses the camera through the browser.
3. Video frames are continuously processed using COCO-SSD.
4. Detected objects are displayed with bounding boxes.
5. Detected people and objects are counted by the dashboard.
6. Monitored objects are tracked over time.
7. If an item remains unattended for the configured duration, the system generates an alert.
8. Events are recorded in the activity history.

---

## 🤖 Object Detection Model

CCS Lab Guardian uses **COCO-SSD**, a pre-trained object detection model available through TensorFlow.js.

COCO-SSD is capable of recognizing objects from a predefined set of classes. Because it is a pre-trained model, the system can only detect objects that are included in the model's supported classes.

### Monitored Objects

The current system monitors objects including:

* Backpack
* Book
* Laptop
* Cell phone
* Keyboard
* Mouse
* Remote
* TV
* Scissors
* Cup
* Bottle

The list can be modified in the JavaScript configuration.

---

## ⏱️ Unattended-Item Detection

The system monitors selected objects to determine whether they remain in the laboratory environment without a nearby detected person.

An item may be considered unattended when:

* The object is detected by the model.
* The object remains visible for the required duration.
* No person is sufficiently associated with the object.
* The configured unattended-item threshold is reached.

When these conditions are satisfied, the system displays an alert and records the event.

> **Note:** Object detection and person association are dependent on the accuracy and limitations of the COCO-SSD model and camera conditions.

---

## 🛠️ Technologies Used

| Technology       | Purpose                              |
| ---------------- | ------------------------------------ |
| HTML5            | Web page structure                   |
| CSS3             | Interface design and styling         |
| JavaScript       | Application logic                    |
| TensorFlow.js    | Machine learning framework           |
| COCO-SSD         | Real-time object detection           |
| HTML5 Webcam API | Live camera access                   |
| Canvas API       | Bounding boxes and detection overlay |

---

## 📁 Project Structure

```text
CCS-Lab-Guardian/
│
├── index.html
├── app.js
├── styles.css
├── README.md
│
└── assets/
    └── [project assets]
```

> The exact file structure may vary depending on the current project version.

---

## 🚀 Getting Started

### 1. Download or Clone the Repository

Clone the project:

```bash
git clone <repository-url>
```

Then open the project folder.

### 2. Open the Application

The system can be run through a local development server.

For example, using VS Code's **Live Server** extension:

1. Open the project folder in Visual Studio Code.
2. Open `index.html`.
3. Right-click the file.
4. Select **Open with Live Server**.

### 3. Allow Camera Access

When prompted by the browser, allow camera access.

The system requires webcam permission to perform live monitoring.

### 4. Start Monitoring

Click:

```text
Start Camera
```

The live webcam feed will appear and object detection will begin.

---

## 📷 Using the System

### Starting the Camera

Click **Start Camera** to begin live laboratory monitoring.

Once the camera is active:

* The live video feed is displayed.
* Object detection begins automatically.
* Detected objects receive bounding boxes.
* Dashboard counters are updated.
* Monitored objects are tracked.

### Stopping the Camera

Click **Stop Camera** to end live monitoring.

The camera stream will be stopped and the system will return to the monitoring waiting state.

---

## ⚠️ Limitations

CCS Lab Guardian has several limitations:

### COCO-SSD Class Limitations

The system can only recognize objects included in the COCO-SSD model's predefined classes. Objects outside those classes may not be detected.

### Detection Accuracy

Detection accuracy may be affected by:

* Lighting conditions
* Camera quality
* Object size
* Object distance
* Occlusion
* Camera angle
* Background clutter

### Person-Object Association

The system estimates whether an object is unattended based on visual detection. It cannot determine human ownership or intent with certainty.

### Webcam Requirements

The system requires:

* A working webcam
* Browser camera permissions
* A modern web browser
* Sufficient processing capability for real-time inference

### Not a Security Replacement

The system is designed to assist laboratory monitoring. It should not be treated as a complete replacement for human supervision or professional security systems.

---

## 🔐 Privacy Considerations

CCS Lab Guardian uses a live webcam to analyze the laboratory environment.

Because camera feeds may contain people and personal belongings:

* Camera access should only be enabled when necessary.
* Users should be informed that monitoring is taking place.
* The system should be used only for its intended laboratory-monitoring purpose.
* Camera data should be handled responsibly.
* The application should follow applicable institutional privacy policies.

The system is intended to perform object detection from the live camera feed rather than to identify individuals.

---

## 🔮 Future Improvements

Possible future improvements include:

* Custom object detection for laboratory-specific equipment
* Improved unattended-item tracking
* More accurate person-object association
* Configurable alert thresholds
* Email or notification-based alerts
* Detection logs and downloadable reports
* Improved detection performance
* Mobile and tablet support
* More advanced privacy controls
* Integration with laboratory management systems
* Custom-trained models for specific laboratory environments

---

## 👥 Project

**Project Name:** CCS Lab Guardian

**Project Type:** Browser-Based Laboratory Monitoring System

**Primary Function:** Real-Time Object Detection and Unattended-Item Monitoring

**Object Detection Model:** COCO-SSD

**Machine Learning Framework:** TensorFlow.js

---

## 📄 Disclaimer

CCS Lab Guardian is an academic/project-based system developed to demonstrate the application of real-time object detection for laboratory monitoring.

The system's predictions are dependent on the underlying COCO-SSD model and environmental conditions. Detection results should therefore be treated as **assistance for monitoring purposes** and not as definitive evidence of an unattended or misplaced item.
