# RedView - Mars Mission Explorer

A clean, professional web application for exploring Mars rover missions through NASA's public APIs. Built for SE 300 by Team Martians.

## Features

- **Interactive Mars Rover Data**: Browse images from Perseverance and Curiosity rovers
- **Advanced Filtering**: Filter by Sol (mission day), camera type, and mission parameters
- **Real-time Data**: Access the latest mission telemetry directly from NASA APIs
- **Responsive Design**: Clean, Mars-themed UI that works on desktop and mobile
- **Image Gallery**: Grid and list views with detailed modal popups
- **Download Functionality**: Save high-resolution Mars images locally

## Technology Stack

- **Backend**: Node.js with Express
- **Frontend**: Vanilla JavaScript, CSS Grid/Flexbox
- **APIs**: NASA Mars Rover Photos API, NASA InSight Weather API
- **Styling**: Custom CSS with Mars-inspired design system

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn
- NASA API Key (free from https://api.nasa.gov/)

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd redview
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env
```
Edit `.env` and add your NASA API key:
```
NASA_API_KEY=your_actual_api_key_here
PORT=3000
```

4. **Start the development server**
```bash
npm run dev
```

5. **Open your browser**
Navigate to `http://localhost:3000`

## Project Structure

```
redview/
├── server.js              # Main server file
├── package.json           # Dependencies and scripts
├── .env                   # Environment variables (create from .env.example)
├── public/                # Static files
│   ├── index.html         # Home page
│   ├── perseverance.html  # Perseverance rover page
│   ├── curiosity.html     # Curiosity rover page
│   ├── css/               # Stylesheets
│   │   ├── main.css       # Global styles
│   │   ├── rover.css      # Rover-specific styles
│   │   └── modal.css      # Modal styles
│   └── js/                # Client-side JavaScript
│       ├── main.js        # Global functionality
│       ├── perseverance.js # Perseverance page logic
│       ├── curiosity.js   # Curiosity page logic
│       └── imageModal.js  # Image modal functionality
├── utils/                 # Server utilities
│   └── nasaApi.js         # NASA API integration
└── README.md              # This file
```

## API Endpoints

- `GET /api/rover/:rover/photos` - Get rover photos with filtering
- `GET /api/rover/:rover/latest` - Get latest photos from rover
- `GET /` - Home page
- `GET /perseverance` - Perseverance rover page  
- `GET /curiosity` - Curiosity rover page

## Usage

### Home Page
- Overview of active Mars missions
- Quick access to rover-specific pages
- Mission statistics and status

### Rover Pages
- **Search by Sol**: Enter a mission day number to see images from that day
- **Filter by Camera**: Select specific cameras (Mastcam, Hazard Avoidance, etc.)
- **Latest Images**: Get the most recent photos from the rover
- **View Modes**: Toggle between grid and list views
- **Image Details**: Click any image to view full details and download

### Image Modal
- High-resolution image display
- Mission metadata (Sol, Earth date, camera info)
- Download original image
- View full-size in new tab

## NASA API Integration

This application uses the following NASA APIs:
- **Mars Rover Photos API**: Retrieve images from Curiosity, Perseverance, and Opportunity
- Rate limiting implemented to respect API limits
- Automatic error handling and retry logic

## Design Philosophy

RedView follows a clean, professional design approach:
- **Mars-inspired color palette** using authentic reds and oranges
- **Minimalist interface** focusing on content over decoration
- **Professional typography** for scientific credibility  
- **Responsive design** for all device sizes
- **Subtle animations** that enhance rather than distract

## Contributing

This project was built for SE 300. For contributions:

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## Team

**Team Martians** - SE 300 Project Team 1
- Jax Chong
- Samuil Nikolov  
- Aaron Shapiro
- Garrett Lynn

## License

This project is for educational purposes (SE 300). All Mars mission data is provided by NASA and is in the public domain.

## Acknowledgments

- NASA for providing free access to Mars mission data
- Mars rover teams for their incredible scientific work
- The open-source community for tools and inspiration

## Future Enhancements

- 3D terrain visualization using Cesium
- Real-time weather data from Mars
- Mission timeline and rover path tracking
- Image comparison tools
- Social sharing functionality
- Offline data caching

## Troubleshooting

### Common Issues

**API Key Not Working**
- Ensure your NASA API key is valid and active
- Check that the `.env` file is in the root directory
- Restart the server after changing environment variables

**Images Not Loading**
- Check your internet connection
- Verify NASA APIs are accessible
- Look for rate limiting messages in console

**Server Won't Start**
- Make sure Node.js is installed (v14+)
- Run `npm install` to install dependencies
- Check that port 3000 is available

### Getting Help

- Check the browser console for error messages
- Review server logs for API issues
- Ensure all dependencies are properly installed

---

*Built with ❤️ for Mars exploration and SE 300*