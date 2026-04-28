import React, { useState, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Autocomplete } from '@react-google-maps/api';
import { Navigation, Loader2, Search } from 'lucide-react';

const containerStyle = {
  width: '100%',
  height: '100%'
};

// Premium "Silver" style for Google Maps
const mapStyles = [
  {
    "elementType": "geometry",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{ "visibility": "off" }]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{ "color": "#f5f5f5" }]
  },
  {
    "featureType": "administrative.land_parcel",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#bdbdbd" }]
  },
  {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{ "color": "#e5e5e5" }]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "road",
    "elementType": "geometry",
    "stylers": [{ "color": "#ffffff" }]
  },
  {
    "featureType": "road.arterial",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#757575" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{ "color": "#dadada" }]
  },
  {
    "featureType": "road.highway",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#616161" }]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  },
  {
    "featureType": "transit.line",
    "elementType": "geometry",
    "stylers": [{ "color": "#e5e5e5" }]
  },
  {
    "featureType": "transit.station",
    "elementType": "geometry",
    "stylers": [{ "color": "#eeeeee" }]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{ "color": "#c9c9c9" }]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{ "color": "#9e9e9e" }]
  }
];

interface LocationPickerProps {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  onAddressChange?: (address: string) => void;
}

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

export const LocationPicker = ({ lat, lng, onChange, onAddressChange }: LocationPickerProps) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: libraries
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [detecting, setDetecting] = useState(false);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newLat = e.latLng.lat();
      const newLng = e.latLng.lng();
      onChange(newLat, newLng);
      
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
        if (status === 'OK' && results?.[0]) {
          if (onAddressChange) onAddressChange(results[0].formatted_address);
        }
      });
    }
  }, [onChange, onAddressChange]);

  const handleDetectLocation = () => {
    setDetecting(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newLat = position.coords.latitude;
          const newLng = position.coords.longitude;
          onChange(newLat, newLng);
          map?.panTo({ lat: newLat, lng: newLng });
          
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ location: { lat: newLat, lng: newLng } }, (results, status) => {
            if (status === 'OK' && results?.[0]) {
              if (onAddressChange) onAddressChange(results[0].formatted_address);
            }
          });
          setDetecting(false);
        },
        () => {
          alert("Could not detect location. Please enable GPS.");
          setDetecting(false);
        },
        { enableHighAccuracy: true }
      );
    }
  };

  const onPlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (place?.geometry?.location) {
      const newLat = place.geometry.location.lat();
      const newLng = place.geometry.location.lng();
      onChange(newLat, newLng);
      map?.panTo({ lat: newLat, lng: newLng });
      if (onAddressChange && place.formatted_address) {
        onAddressChange(place.formatted_address);
      }
    }
  };

  if (!isLoaded) return (
    <div className="w-full aspect-[16/9] bg-surface-container rounded-[32px] flex flex-col items-center justify-center gap-3 border-2 border-surface-container/50">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
      <span className="text-[10px] font-bold tracking-widest uppercase opacity-60">INITIALIZING GOOGLE MAPS...</span>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <label className="block text-[10px] font-bold text-neutral-400 tracking-[0.2em] uppercase shrink-0">
          GOOGLE GEOSPATIAL RECOGNITION
        </label>
        <button
          type="button"
          onClick={handleDetectLocation}
          disabled={detecting}
          className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-full font-bold text-[10px] tracking-widest uppercase transition-all disabled:opacity-50 group shrink-0"
        >
          <Navigation className={`w-3.5 h-3.5 transition-transform group-hover:rotate-12 ${detecting ? 'animate-pulse' : ''}`} />
          {detecting ? 'PINGING...' : 'USE LIVE GPS'}
        </button>
      </div>

      <div className="relative group">
        <Autocomplete
          onLoad={(autocomplete) => (autocompleteRef.current = autocomplete)}
          onPlaceChanged={onPlaceChanged}
        >
          <input 
            type="text" 
            placeholder="Search for an address or place..."
            className="w-full bg-[#F3F3F3] border-1.5 border-transparent rounded-[20px] px-6 py-4 pr-14 outline-none focus:border-primary focus:bg-white focus:shadow-[0_10px_30px_-10px_rgba(255,79,0,0.15)] transition-all font-medium text-sm"
          />
        </Autocomplete>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
          <Search className="w-5 h-5 text-neutral-400 group-focus-within:text-primary transition-colors" />
        </div>
      </div>
      
      <div className="w-full aspect-[16/9] md:aspect-[21/9] rounded-[32px] overflow-hidden border-2 border-surface-container relative isolate z-0 shadow-lg group">
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={{ lat, lng }}
          zoom={15}
          onLoad={onLoad}
          onUnmount={onUnmount}
          onClick={onMapClick}
          options={{
            disableDefaultUI: false,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
            styles: mapStyles
          }}
        >
          <Marker 
            position={{ lat, lng }} 
            animation={google.maps.Animation.DROP}
            icon={{
               path: google.maps.SymbolPath.CIRCLE,
               fillColor: '#ff4f00',
               fillOpacity: 1,
               strokeColor: '#ffffff',
               strokeWeight: 4,
               scale: 10,
            }}
          />
        </GoogleMap>
        
        {/* Visual Overlay */}
        <div className="absolute bottom-4 left-4 z-10 pointer-events-none">
          <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-black/5 shadow-sm flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-[8px] font-black tracking-widest uppercase text-on-surface/60">
              COORDS: {lat.toFixed(4)}, {lng.toFixed(4)}
            </span>
          </div>
        </div>
      </div>
      <p className="text-[9px] text-neutral-400 italic">
        * Click anywhere on the map to pinpoint the exact incident location.
      </p>
    </div>
  );
};

export const StaticLocationMap = ({ lat, lng }: { lat: number; lng: number }) => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
  });

  if (!isLoaded) return (
    <div className="w-full aspect-[21/9] bg-surface-container rounded-[32px] animate-pulse" />
  );

  return (
    <div className="w-full aspect-[21/9] rounded-[32px] overflow-hidden border-2 border-surface-container relative isolate z-0 shadow-sm">
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={{ lat, lng }}
        zoom={16}
        options={{
          disableDefaultUI: true,
          draggable: false,
          styles: mapStyles
        }}
      >
        <Marker 
          position={{ lat, lng }} 
          icon={{
             path: google.maps.SymbolPath.CIRCLE,
             fillColor: '#ff4f00',
             fillOpacity: 1,
             strokeColor: '#ffffff',
             strokeWeight: 4,
             scale: 8,
          }}
        />
      </GoogleMap>
    </div>
  );
};
