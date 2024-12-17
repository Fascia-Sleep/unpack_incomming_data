# Fascia Real-Time Data Visualization Task

## Project Background
You are provided with a working React project that handles MQTT connection and data parsing from Fascia devices. The project currently displays the raw data in a text format. Your task is to create visualizations of this data using D3.js.
![k6NqMPBYPJ.png](src/img/k6NqMPBYPJ.png)
## Provided Code
- `BasicMQTTConnect.js`: Handles MQTT connection, data streaming, and parsing
- `BasicMQTTConnect.css`: Styling for the connection component

## Your Task
Create a new React component `SignalVisualizer` that:

1. Takes the parsed data from BasicMQTTConnect and visualizes it using D3.js
2. Shows a 30-second sliding window of the following signals:
   - EEG channels (Pz, Cz, Fp1, Fp2)
   - EMG channels (EMG1, EMG2)
   - EOG channels (EOG1, EOG2)

### Core Requirements
- Implement real-time plotting using D3.js
- Display a 30-second sliding window (7,500 samples at 250Hz)
- Use appropriate Y-axis scales:
  * EEG: ±100 μV
  * EMG: ±500 μV
  * EOG: ±500 μV
- Show time on X-axis in seconds
- Include proper axes labels and units

### Technical Details
- Sampling rate: 250 Hz
- Data format from BasicMQTTConnect:
  ```javascript
  {
    ads_1: value,  // Pz (in μV)
    ads_2: value,  // Cz (in μV)
    ads_3: value,  // Fp1 (in μV)
    ads_4: value,  // Fp2 (in μV)
    ads_5: value,  // EMG1 (in μV)
    ads_6: value,  // EMG2 (in μV)
    ads_7: value,  // EOG1 (in μV)
    ads_8: value,  // EOG2 (in μV)
    // ... other signals
  }


# Getting Started with Create React App




This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in your browser.

The page will reload when you make changes.\
You may also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

### Code Splitting

This section has moved here: [https://facebook.github.io/create-react-app/docs/code-splitting](https://facebook.github.io/create-react-app/docs/code-splitting)

### Analyzing the Bundle Size

This section has moved here: [https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size](https://facebook.github.io/create-react-app/docs/analyzing-the-bundle-size)

### Making a Progressive Web App

This section has moved here: [https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app](https://facebook.github.io/create-react-app/docs/making-a-progressive-web-app)

### Advanced Configuration

This section has moved here: [https://facebook.github.io/create-react-app/docs/advanced-configuration](https://facebook.github.io/create-react-app/docs/advanced-configuration)

### Deployment

This section has moved here: [https://facebook.github.io/create-react-app/docs/deployment](https://facebook.github.io/create-react-app/docs/deployment)

### `npm run build` fails to minify

This section has moved here: [https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify](https://facebook.github.io/create-react-app/docs/troubleshooting#npm-run-build-fails-to-minify)
