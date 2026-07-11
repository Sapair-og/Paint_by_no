import React, { useState, useEffect, useRef } from 'react';
import { jsPDF } from 'jspdf';

// Palette Presets
const PRESETS = {
  auto: { name: 'Auto-Generate (K-Means)', colors: null },
  wax24: {
    name: 'Crayola Wax Crayons (24 Pack)',
    colors: [
      '#ED0A3F', '#FF681F', '#BB3385', '#FF8833', '#FFAE42', '#FBE870', '#C5E17A', '#1CAC78',
      '#0095B6', '#0066FF', '#6456B7', '#8359A3', '#AF593E', '#000000', '#FFFFFF', '#8B8680',
      '#FDD5B1', '#1DACD6', '#4F69C6', '#FD0E35', '#F7468A', '#3C69E7', '#01786F', '#FCD667'
    ]
  },
  pencil24: {
    name: 'Prismacolor Colored Pencils (24 Pack)',
    colors: [
      '#FFEF00', '#F3A23A', '#FF8F00', '#FCD667', '#FFD0A9', '#F62817', '#E30022', '#7C3030',
      '#FFC0CB', '#C8509B', '#B09FCA', '#7F00FF', '#324AB2', '#0073CF', '#2A52BE', '#00416A',
      '#8DB600', '#089404', '#355E3B', '#013220', '#8B5A2B', '#5C4033', '#000000', '#FFFFFF'
    ]
  },
  anime: {
    name: 'Classic Anime & Cartoon (Bright)',
    colors: ['#FF4D6D', '#FF758F', '#FFB3C1', '#FFD7BA', '#FFE5EC', '#38B000', '#007200', '#0096C7', '#03045E', '#FFB703', '#FB8500', '#8338EC', '#3A86C8', '#2A2A2A', '#FDFDFD']
  },
  vintage: {
    name: 'Vintage & Retro Portrait (Muted)',
    colors: ['#4E3629', '#855E42', '#C69C6D', '#EAD2AC', '#E2D4C9', '#6B2D1E', '#9E6D5C', '#5F7467', '#8C9E8E', '#4B5563', '#1F2937', '#F5F5F0']
  },
  cyberpunk: {
    name: 'Cyberpunk Neon Nights',
    colors: ['#00F0FF', '#FF007F', '#9000FF', '#120036', '#00FF66', '#FFFF00', '#FF5B00', '#2E004F', '#0D0D11', '#FFFFFF']
  },
  nordic: {
    name: 'Nordic Forest & Fjords',
    colors: ['#1A303A', '#2D5263', '#607D8B', '#90A4AE', '#B0BEC5', '#ECEFF1', '#1B4D3E', '#3D8C6F', '#7CA88D', '#5E4A3E', '#8C7461', '#C6A18D']
  },
  earth: {
    name: 'Warm Earthtones (Terracotta & Sand)',
    colors: ['#5C2E0B', '#8C4F2B', '#C97A53', '#E6B095', '#F5DFD5', '#2C3A27', '#4A5B43', '#8C9A86', '#C79E34', '#E6C15C', '#1E2522']
  },
  ocean: {
    name: 'Ocean Depth Shading',
    colors: ['#03045E', '#023E8A', '#0077B6', '#0096C7', '#00B4D8', '#48CAE4', '#90E0EF', '#ADE8F4', '#CAF0F8', '#E9C46A', '#F4A261', '#E76F51']
  },
  slate: {
    name: 'Monochrome Slate (Grayscale)',
    colors: ['#000000', '#1F2937', '#374151', '#4B5563', '#6B7280', '#9CA3AF', '#D1D5DB', '#E5E7EB', '#F3F4F6', '#FFFFFF']
  },
  crayola12: {
    name: 'Crayola 12-Pack',
    colors: ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#7E3A94', '#FFC0CB', '#A52A2A', '#FFFFFF', '#808080', '#000000', '#00FFFF']
  },
  faber12: {
    name: 'Faber-Castell 12-Pack',
    colors: ['#C21E2E', '#E45A17', '#F0C808', '#1E6C2D', '#1C4E80', '#0D1B2A', '#654321', '#E69E83', '#000000', '#FFFFFF', '#7E3A94', '#1EAA2C']
  },
  doms12: {
    name: 'DOMS 12-Pack',
    colors: ['#FF2400', '#FF6B00', '#FFD700', '#2E8B57', '#4169E1', '#8A2BE2', '#C71585', '#8B4513', '#000000', '#FFFFFF', '#008080', '#FF4500']
  },
  pastels: {
    name: 'Pastel Dreams',
    colors: ['#FFB7B2', '#FFDAC1', '#E2F0CB', '#B5EAD7', '#C7CEEA', '#FFC6FF', '#FFF1CA', '#D8E2DC', '#B3E5FC']
  },
  sunset: {
    name: 'Sunset Glow',
    colors: ['#F72585', '#B5179E', '#7209B7', '#560BAD', '#480CA8', '#3F37C9', '#3A0CA3', '#4361EE', '#4CC9F0', '#F77F00', '#FCBF49', '#EAE2B7']
  }
};

// Crayon physical names mapping
const WAX_NAMES = {
  '#ED0A3F': 'Red', '#FF681F': 'Red-Orange', '#BB3385': 'Red-Violet', '#FF8833': 'Orange',
  '#FFAE42': 'Yellow-Orange', '#FBE870': 'Yellow', '#C5E17A': 'Yellow-Green', '#1CAC78': 'Green',
  '#0095B6': 'Blue-Green', '#0066FF': 'Blue', '#6456B7': 'Blue-Violet', '#8359A3': 'Violet (Purple)',
  '#AF593E': 'Brown', '#000000': 'Black', '#FFFFFF': 'White', '#8B8680': 'Gray',
  '#FDD5B1': 'Apricot', '#1DACD6': 'Cerulean', '#4F69C6': 'Indigo', '#FD0E35': 'Scarlet',
  '#F7468A': 'Violet-Red', '#3C69E7': 'Bluetiful', '#01786F': 'Pine Green', '#FCD667': 'Goldenrod'
};

// Prismacolor colored pencil physical names mapping
const PENCIL_NAMES = {
  '#FFEF00': 'Canary Yellow', '#F3A23A': 'Spanish Orange', '#FF8F00': 'Orange', '#FCD667': 'Goldenrod',
  '#FFD0A9': 'Peach', '#F62817': 'Poppy Red', '#E30022': 'Crimson Red', '#7C3030': 'Tuscan Red',
  '#FFC0CB': 'Pink', '#C8509B': 'Mulberry/Magenta', '#B09FCA': 'Parma Violet', '#7F00FF': 'Violet',
  '#324AB2': 'Violet Blue', '#0073CF': 'True Blue', '#2A52BE': 'Cerulean Blue', '#00416A': 'Indigo Blue',
  '#8DB600': 'Apple Green', '#089404': 'True Green', '#355E3B': 'Grass Green', '#013220': 'Dark Green',
  '#8B5A2B': 'Sienna Brown', '#5C4033': 'Dark Brown', '#000000': 'Black', '#FFFFFF': 'White'
};

function App() {
  const [imageSrc, setImageSrc] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [imageInfo, setImageInfo] = useState(null);

  // Settings
  const [k, setK] = useState(12);
  const [minFacetSize, setMinFacetSize] = useState(25);
  const [smoothingPasses, setSmoothingPasses] = useState(2);
  const [selectedPreset, setSelectedPreset] = useState('auto');
  const [customPalette, setCustomPalette] = useState([]);
  
  // State from Worker
  const [result, setResult] = useState(null);
  const [palette, setPalette] = useState([]);
  const [selectedColorIndex, setSelectedColorIndex] = useState(null);
  
  // UI States
  const [activeTab, setActiveTab] = useState('outline');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMsg, setProcessingMsg] = useState('');
  const [progress, setProgress] = useState(0);
  const [eyedropperActive, setEyedropperActive] = useState(false);
  const [customColor, setCustomColor] = useState('#6366F1');
  const [dragActive, setDragActive] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);

  // Outline/Label Customizations
  const [fontSize, setFontSize] = useState(8);

  // Zoom & Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const canvasRef = useRef(null);
  const viewportRef = useRef(null);
  const workerRef = useRef(null);

  // Initialize worker
  useEffect(() => {
    workerRef.current = new Worker(new URL('./pbnWorker.js', import.meta.url), { type: 'module' });

    workerRef.current.onmessage = (e) => {
      const { status, message, progress, result, error } = e.data;
      
      if (status === 'progress') {
        setProcessingMsg(message);
        setProgress(progress);
      } else if (status === 'complete') {
        setResult(result);
        setPalette(result.palette);
        setIsProcessing(false);
        setSelectedColorIndex(null);
      } else if (status === 'error') {
        console.error(error);
        setIsProcessing(false);
        alert('Image processing failed: ' + error);
      }
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Handle active canvas redraws
  useEffect(() => {
    drawCanvas();
  }, [result, activeTab, selectedColorIndex, fontSize]);

  // Viewport Zoom via Wheel
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleWheel = (e) => {
      e.preventDefault();
      const zoomFactor = 1.08;
      setZoom((prev) => {
        const newZoom = e.deltaY < 0 ? prev * zoomFactor : prev / zoomFactor;
        return Math.max(0.1, Math.min(8, newZoom));
      });
    };

    viewport.addEventListener('wheel', handleWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', handleWheel);
  }, []);

  // Set preset colors when selectedPreset changes
  useEffect(() => {
    if (selectedPreset !== 'auto' && selectedPreset !== 'custom') {
      setCustomPalette(PRESETS[selectedPreset].colors);
    } else if (selectedPreset === 'auto') {
      setCustomPalette([]);
    }
  }, [selectedPreset]);

  // Define activePalette for UI rendering
  const activePalette = selectedPreset === 'auto' ? (result ? result.palette : []) : customPalette;

  // Run image processing in Web Worker
  const processImage = (dataOverride = null, kVal = k, cleanupVal = minFacetSize, palOverride = null, smoothVal = smoothingPasses) => {
    const dataToProcess = dataOverride || imageData;
    if (!dataToProcess || !workerRef.current) return;

    setIsProcessing(true);
    setProgress(0);
    setProcessingMsg('Initializing worker...');

    // Determine the palette to send to the worker
    let activePal = null;
    if (palOverride !== null) {
      activePal = palOverride;
    } else if (selectedPreset === 'custom') {
      activePal = customPalette;
    } else if (selectedPreset !== 'auto') {
      activePal = PRESETS[selectedPreset].colors;
    }

    // Deep copy ImageData fields to avoid serialization issues
    const imgDataBuffer = {
      data: new Uint8ClampedArray(dataToProcess.data),
      width: dataToProcess.width,
      height: dataToProcess.height
    };

    workerRef.current.postMessage({
      action: 'process',
      imageData: imgDataBuffer,
      k: kVal,
      minFacetSize: cleanupVal,
      customPalette: activePal,
      smoothingPasses: smoothVal
    });
  };

  // Helper RGB converters
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  };

  const rgbToHex = (r, g, b) => {
    return '#' + [r, g, b].map((x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  };

  // Physical color match recommender
  const getClosestColorMatch = (hex, presetKey) => {
    if (!hex) return null;
    const rgb = hexToRgb(hex);
    const preset = PRESETS[presetKey];
    if (!preset) return null;
    
    let minDist = Infinity;
    let bestHex = null;
    
    preset.colors.forEach(presetHex => {
      const prgb = hexToRgb(presetHex);
      const dist = (rgb[0] - prgb[0])**2 + (rgb[1] - prgb[1])**2 + (rgb[2] - prgb[2])**2;
      if (dist < minDist) {
        minDist = dist;
        bestHex = presetHex;
      }
    });
    
    if (!bestHex) return null;
    
    // Max RGB 3D Euclidean distance is sqrt(3 * 255^2) = 441.67
    const similarity = Math.round((1 - Math.sqrt(minDist) / 441.67) * 100);
    const nameMap = presetKey === 'wax24' ? WAX_NAMES : PENCIL_NAMES;
    return {
      name: nameMap[bestHex] || bestHex,
      hex: bestHex,
      similarity
    };
  };

  // Image upload
  const handleImageFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      alert('Please upload a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        // Downscale image to a max dimension of 600px for responsive in-browser calculations
        const maxDim = 600;
        let w = img.width;
        let h = img.height;

        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        const imgData = ctx.getImageData(0, 0, w, h);
        setImageData(imgData);
        setImageSrc(event.target.result);
        setImageInfo({
          name: file.name,
          width: img.width,
          height: img.height,
          processedWidth: w,
          processedHeight: h
        });

        // Reset view states
        setZoom(1);
        setPan({ x: 0, y: 0 });

        // Trigger first process
        const activePal = selectedPreset === 'auto' ? null : (selectedPreset === 'custom' ? customPalette : PRESETS[selectedPreset].colors);
        processImage(imgData, k, minFacetSize, activePal, smoothingPasses);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setDragActive(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  // Draw output onto standard Canvas
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !result) return;
    const ctx = canvas.getContext('2d');
    const { width, height, quantizedData, outlineData, labels } = result;

    canvas.width = width;
    canvas.height = height;

    if (activeTab === 'original') {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
      };
      img.src = imageSrc;
    } else if (activeTab === 'processed') {
      const imgData = new ImageData(new Uint8ClampedArray(quantizedData), width, height);
      ctx.putImageData(imgData, 0, 0);
    } else if (activeTab === 'outline') {
      if (selectedColorIndex !== null) {
        // Highlight active color
        const imgData = ctx.createImageData(width, height);
        const paletteRGB = result.palette.map(hexToRgb);
        const targetRGB = paletteRGB[selectedColorIndex];

        for (let i = 0; i < outlineData.length; i += 4) {
          const isOutline = outlineData[i] === 0;
          const qr = quantizedData[i];
          const qg = quantizedData[i + 1];
          const qb = quantizedData[i + 2];

          if (isOutline) {
            imgData.data[i] = 0;
            imgData.data[i + 1] = 0;
            imgData.data[i + 2] = 0;
            imgData.data[i + 3] = 255;
          } else if (qr === targetRGB[0] && qg === targetRGB[1] && qb === targetRGB[2]) {
            imgData.data[i] = targetRGB[0];
            imgData.data[i + 1] = targetRGB[1];
            imgData.data[i + 2] = targetRGB[2];
            imgData.data[i + 3] = 90; // opacity overlay for visibility
          } else {
            imgData.data[i] = 255;
            imgData.data[i + 1] = 255;
            imgData.data[i + 2] = 255;
            imgData.data[i + 3] = 255;
          }
        }
        ctx.putImageData(imgData, 0, 0);
      } else {
        const imgData = new ImageData(new Uint8ClampedArray(outlineData), width, height);
        ctx.putImageData(imgData, 0, 0);
      }

      // Draw labels onto the canvas
      ctx.font = `${fontSize}px Outfit, Inter, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      labels.forEach((label) => {
        // Skip rendering numbers in micro-shapes to avoid overlapping visual noise
        if (label.size > 12) {
          const isSelected = selectedColorIndex === label.colorIndex;
          if (selectedColorIndex !== null) {
            ctx.fillStyle = isSelected ? '#000000' : 'rgba(100, 100, 100, 0.15)';
            ctx.font = `${isSelected ? 'bold' : 'normal'} ${fontSize}px Outfit, Inter, sans-serif`;
          } else {
            ctx.fillStyle = '#4b5563';
            ctx.font = `${fontSize}px Outfit, Inter, sans-serif`;
          }
          ctx.fillText(label.number.toString(), label.x, label.y);
        }
      });
    }
  };

  // Viewport interactions (Drag-to-pan)
  const handlePointerDown = (e) => {
    if (eyedropperActive) return; // Prevent pan during eyedropper active
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Eyedropper color swab picker
  const handleCanvasClick = (e) => {
    if (!eyedropperActive || !canvasRef.current || !result) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    // Map screen coordinates relative to canvas bounding width/height
    const clickX = (e.clientX - rect.left) / rect.width;
    const clickY = (e.clientY - rect.top) / rect.height;

    const canvasX = Math.min(canvas.width - 1, Math.max(0, Math.floor(clickX * canvas.width)));
    const canvasY = Math.min(canvas.height - 1, Math.max(0, Math.floor(clickY * canvas.height)));

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const tempCtx = tempCanvas.getContext('2d');

    const img = new Image();
    img.onload = () => {
      tempCtx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pixel = tempCtx.getImageData(canvasX, canvasY, 1, 1).data;
      const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);

      // Add to palette configuration
      addCustomColor(hex);
      setEyedropperActive(false);
    };
    img.src = imageSrc;
  };

  const addCustomColor = (colorHex) => {
    const cleanedHex = colorHex.trim();
    if (!/^#[0-9A-F]{6}$/i.test(cleanedHex)) {
      alert('Please enter a valid 6-character HEX code (e.g. #FF0000).');
      return;
    }

    let nextPalette = [...customPalette];
    if (selectedPreset !== 'auto' && selectedPreset !== 'custom' && customPalette.length === 0) {
      nextPalette = [...PRESETS[selectedPreset].colors];
    }

    if (nextPalette.includes(cleanedHex)) {
      alert('Color is already present in your active palette.');
      return;
    }

    const updatedPalette = [...nextPalette, cleanedHex];
    setCustomPalette(updatedPalette);
    setSelectedPreset('custom');

    // Trigger update automatically if image exists
    if (imageData) {
      processImage(imageData, k, minFacetSize, updatedPalette, smoothingPasses);
    }
  };

  const removeCustomColor = (indexToRemove) => {
    let nextPalette = [...customPalette];
    if (selectedPreset !== 'auto' && selectedPreset !== 'custom' && customPalette.length === 0) {
      nextPalette = [...PRESETS[selectedPreset].colors];
    }

    const updatedPalette = nextPalette.filter((_, idx) => idx !== indexToRemove);
    setCustomPalette(updatedPalette);
    setSelectedPreset('custom');

    if (imageData) {
      processImage(imageData, k, minFacetSize, updatedPalette, smoothingPasses);
    }
  };

  // Bulk Import of Color Codes
  const handleBulkImport = () => {
    const hexRegex = /#?([0-9A-Fa-f]{6})\b/g;
    const matches = [];
    let match;

    while ((match = hexRegex.exec(bulkImportText)) !== null) {
      const hex = '#' + match[1].toUpperCase();
      if (!matches.includes(hex)) {
        matches.push(hex);
      }
    }

    if (matches.length === 0) {
      alert('No valid 6-digit HEX color codes found in the pasted text.');
      return;
    }

    let nextPalette = [...customPalette];
    if (selectedPreset !== 'auto' && selectedPreset !== 'custom') {
      nextPalette = [...PRESETS[selectedPreset].colors];
    }

    const mergedPalette = [...new Set([...nextPalette, ...matches])];
    setCustomPalette(mergedPalette);
    setSelectedPreset('custom');
    setBulkImportText('');
    setShowBulkImport(false);

    if (imageData) {
      processImage(imageData, k, minFacetSize, mergedPalette, smoothingPasses);
    }
  };

  // Compile PDF document
  const exportToPDF = () => {
    if (!result) return;
    const { palette: activeColors, width, height, labels } = result;

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // --- Page 1: Color Swatch Legend ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(20, 27, 45);
    doc.text('Paint-by-Numbers Color Legend', 20, 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generated: ${new Date().toLocaleDateString()} | File: ${imageInfo?.name || 'custom-project'}`, 20, 32);

    doc.setLineWidth(0.5);
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 36, pageWidth - 20, 36);

    let yPos = 46;
    doc.setFontSize(11);

    activeColors.forEach((hex, idx) => {
      if (yPos > pageHeight - 35) {
        doc.addPage();
        yPos = 25;
      }

      // Index Indicator
      doc.setFont('helvetica', 'bold');
      doc.setFillColor(241, 245, 249);
      doc.rect(20, yPos, 12, 12, 'F');
      doc.setTextColor(99, 102, 241);
      doc.text((idx + 1).toString(), 26, yPos + 7.5, { align: 'center' });

      // RGB Color Block
      const rgb = hexToRgb(hex);
      doc.setFillColor(rgb[0], rgb[1], rgb[2]);
      doc.rect(36, yPos, 22, 12, 'F');
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.1);
      doc.rect(36, yPos, 22, 12, 'S');

      // Hex Code Value
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(`HEX Code: ${hex.toUpperCase()}`, 64, yPos + 7.5);

      // Physical swab box for real paint
      doc.setDrawColor(148, 163, 184);
      doc.setLineWidth(0.3);
      doc.rect(pageWidth - 55, yPos, 35, 12, 'S');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Paint Swab swab here', pageWidth - 37.5, yPos + 7.5, { align: 'center' });
      doc.setFontSize(11);

      yPos += 18;
    });

    // --- Page 2: Scaled Blueprint ---
    doc.addPage('a4', width > height ? 'landscape' : 'portrait');
    const bpWidth = doc.internal.pageSize.getWidth();
    const bpHeight = doc.internal.pageSize.getHeight();

    // Create high-res printing canvas
    const printCanvas = document.createElement('canvas');
    const upscaleMultiplier = 3.0; // 3x scale up for printing quality
    printCanvas.width = width * upscaleMultiplier;
    printCanvas.height = height * upscaleMultiplier;
    const printCtx = printCanvas.getContext('2d');

    // Fill white background
    printCtx.fillStyle = '#ffffff';
    printCtx.fillRect(0, 0, printCanvas.width, printCanvas.height);

    // Render outline borders at 3x scale
    const printOutline = printCtx.createImageData(printCanvas.width, printCanvas.height);
    for (let y = 0; y < printCanvas.height; y++) {
      for (let x = 0; x < printCanvas.width; x++) {
        const origX = Math.floor(x / upscaleMultiplier);
        const origY = Math.floor(y / upscaleMultiplier);
        const origIdx = (origY * width + origX) * 4;
        const targetIdx = (y * printCanvas.width + x) * 4;

        printOutline.data[targetIdx] = result.outlineData[origIdx];
        printOutline.data[targetIdx + 1] = result.outlineData[origIdx + 1];
        printOutline.data[targetIdx + 2] = result.outlineData[origIdx + 2];
        printOutline.data[targetIdx + 3] = result.outlineData[origIdx + 3];
      }
    }
    printCtx.putImageData(printOutline, 0, 0);

    // Draw print labels
    printCtx.font = `bold ${fontSize * 1.5 * upscaleMultiplier}px Arial`;
    printCtx.fillStyle = '#374151'; // dark grey print
    printCtx.textAlign = 'center';
    printCtx.textBaseline = 'middle';

    labels.forEach((label) => {
      if (label.size > 8) {
        printCtx.fillText(
          label.number.toString(),
          label.x * upscaleMultiplier,
          label.y * upscaleMultiplier
        );
      }
    });

    const printImgUrl = printCanvas.toDataURL('image/png');

    const margin = 10;
    const printableW = bpWidth - margin * 2;
    const printableH = bpHeight - margin * 2;

    const imgRatio = width / height;
    const pageRatio = printableW / printableH;

    let finalW = printableW;
    let finalH = printableH;

    if (imgRatio > pageRatio) {
      finalH = printableW / imgRatio;
    } else {
      finalW = printableH * imgRatio;
    }

    const xOffset = margin + (printableW - finalW) / 2;
    const yOffset = margin + (printableH - finalH) / 2;

    doc.addImage(printImgUrl, 'PNG', xOffset, yOffset, finalW, finalH);

    const baseName = imageInfo?.name.split('.')[0] || 'paint-by-numbers';
    doc.save(`${baseName}-paint-by-numbers.pdf`);
  };

  // Compile vector SVG outlines document
  const exportToSVG = () => {
    if (!result || !result.svgPathString) return;
    const { width, height, labels } = result;
    
    let svgText = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`;
    // Add white background canvas
    svgText += `  <rect width="${width}" height="${height}" fill="white" />\n`;
    // Add boundary outline paths
    svgText += `  <path d="${result.svgPathString}" stroke="#333333" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" fill="none" />\n`;
    
    // Add text numbers for coloring
    svgText += `  <g font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}px" font-weight="bold" fill="#4b5563" text-anchor="middle" dominant-baseline="central">\n`;
    labels.forEach((label) => {
      if (label.size > 8) {
        svgText += `    <text x="${label.x}" y="${label.y}">${label.number}</text>\n`;
      }
    });
    svgText += `  </g>\n`;
    svgText += `</svg>`;
    
    // Download SVG file
    const blob = new Blob([svgText], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const baseName = imageInfo?.name.split('.')[0] || 'paint-by-numbers';
    link.download = `${baseName}-blueprint.svg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleZoom = (direction) => {
    setZoom((prev) => {
      const step = direction === 'in' ? 1.25 : 0.8;
      const nextZoom = prev * step;
      return Math.max(0.1, Math.min(8, nextZoom));
    });
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="logo-section">
          <div className="logo-icon">P</div>
          <div className="logo-text">
            <h1>Paint-by-Numbers Studio</h1>
            <p>Premium browser-side canvas vectorization engine</p>
          </div>
        </div>
        <div className="header-actions" style={{ display: 'flex', gap: '0.75rem' }}>
          {result && (
            <>
              <button
                className="palette-btn"
                onClick={exportToSVG}
                style={{
                  padding: '0.65rem 1rem',
                  borderRadius: '0.75rem',
                  fontWeight: '600',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  height: '42px',
                  backgroundColor: 'rgba(255, 255, 255, 0.03)'
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 13 7 8" />
                  <line x1="12" y1="13" x2="12" y2="3" />
                </svg>
                Export Vector SVG
              </button>
              <button className="btn-primary" onClick={exportToPDF} style={{ padding: '0.65rem 1.25rem', width: 'auto', height: '42px' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.25rem' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Export PDF Blueprint
              </button>
            </>
          )}
        </div>
      </header>

      {/* Main workspace */}
      <div className="main-workspace">
        {/* Sidebar Controls */}
        <aside className="sidebar">
          {/* Section 1: Upload */}
          <div className="sidebar-section">
            <h2 className="section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              1. Image Source
            </h2>
            <div
              className={`dropzone ${dragActive ? 'active' : ''}`}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              onClick={() => document.getElementById('file-upload').click()}
            >
              <div className="dropzone-icon">🖼️</div>
              <div className="dropzone-text">
                <span className="dropzone-highlight">Click to upload</span> or drag and drop
              </div>
              <input
                id="file-upload"
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => e.target.files && handleImageFile(e.target.files[0])}
              />
            </div>
            {imageInfo && (
              <div className="image-file-info">
                <span>{imageInfo.name}</span>
                <span style={{ color: 'var(--text-secondary)' }}>
                  {imageInfo.width}×{imageInfo.height}px
                </span>
              </div>
            )}
          </div>

          {/* Section 2: Palette Options */}
          <div className="sidebar-section">
            <h2 className="section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 14.7255 3.09032 17.1962 4.85857 19C5.34484 19.4863 5.34484 20.2743 4.85857 20.7606C4.37231 21.2468 3.58434 21.2468 3.09808 20.7606C1.19614 18.8587 0 16.223 0 13.2857C0 6.91429 5.37258 1.71429 12 1.71429C18.6274 1.71429 24 6.91429 24 13.2857C24 19.6571 18.6274 24.8571 12 24.8571C10.6121 24.8571 9.27857 24.6206 8.04169 24.1856C7.45269 23.9782 7.15174 23.3274 7.3691 22.7534C7.58646 22.1794 8.23725 21.8785 8.82625 22.0959C9.84918 22.4554 10.9126 22.6429 12 22.6429Z" />
                <circle cx="7.5" cy="10.5" r="2.5" fill="currentColor" />
                <circle cx="11.5" cy="7.5" r="2.5" fill="currentColor" />
                <circle cx="16.5" cy="9.5" r="2.5" fill="currentColor" />
                <circle cx="15.5" cy="14.5" r="2.5" fill="currentColor" />
              </svg>
              2. Color Palette
            </h2>
            <div className="control-group">
              <label className="control-label">Preset Brand / Medium</label>
              <select
                className="select-input"
                value={selectedPreset}
                onChange={(e) => setSelectedPreset(e.target.value)}
              >
                {Object.keys(PRESETS).map((key) => (
                  <option key={key} value={key}>
                    {PRESETS[key].name}
                  </option>
                ))}
              </select>
            </div>

            {selectedPreset === 'auto' && (
              <div className="control-group">
                <label className="control-label">
                  Number of Colors (K)
                  <span className="control-value">{k}</span>
                </label>
                <input
                  type="range"
                  min="4"
                  max="32"
                  step="1"
                  value={k}
                  onChange={(e) => setK(parseInt(e.target.value))}
                />
              </div>
            )}

            {/* Custom Palette Builder */}
            <div className="control-group" style={{ marginTop: '0.25rem' }}>
              <label className="control-label">
                Active Colors ({activePalette.length})
                {selectedColorIndex !== null && (
                  <span style={{ color: 'var(--success-color)', fontSize: '0.75rem' }}>
                    Active Color: #{selectedColorIndex + 1}
                  </span>
                )}
              </label>
              <div className="color-list">
                {activePalette.map((hex, idx) => (
                  <div
                    key={`${hex}-${idx}`}
                    className={`color-chip ${selectedColorIndex === idx ? 'active' : ''}`}
                    style={{ backgroundColor: hex }}
                    onClick={() => setSelectedColorIndex(selectedColorIndex === idx ? null : idx)}
                    title={`Color ${idx + 1}: ${hex}`}
                  >
                    <span className="color-chip-number">{idx + 1}</span>
                    {selectedPreset === 'custom' && (
                      <div
                        className="color-chip-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCustomColor(idx);
                        }}
                      >
                        ×
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Color Matching Recommendations (Collapsible recommendation box) */}
            {selectedColorIndex !== null && activePalette[selectedColorIndex] && (
              <div className="recs-card">
                <p style={{ fontSize: '0.8rem', fontWeight: 'bold', color: 'var(--accent-color)', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.25rem' }}>
                  🎨 Tool Recommendations
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>HEX Value:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: '600' }}>{activePalette[selectedColorIndex].toUpperCase()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Closest Crayon:</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    {getClosestColorMatch(activePalette[selectedColorIndex], 'wax24')?.name}
                    <span style={{ color: 'var(--success-color)', fontWeight: 'normal', marginLeft: '0.25rem' }}>
                      ({getClosestColorMatch(activePalette[selectedColorIndex], 'wax24')?.similarity}%)
                    </span>
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Closest Pencil:</span>
                  <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                    {getClosestColorMatch(activePalette[selectedColorIndex], 'pencil24')?.name}
                    <span style={{ color: 'var(--success-color)', fontWeight: 'normal', marginLeft: '0.25rem' }}>
                      ({getClosestColorMatch(activePalette[selectedColorIndex], 'pencil24')?.similarity}%)
                    </span>
                  </span>
                </div>
              </div>
            )}

            {/* Add Custom Color / Eyedropper */}
            {imageSrc && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div className="palette-builder-actions">
                  <button
                    className={`palette-btn ${eyedropperActive ? 'active' : ''}`}
                    onClick={() => setEyedropperActive(!eyedropperActive)}
                  >
                    <span style={{ fontSize: '1rem' }}>👁️‍🗨️</span>
                    Eyedropper
                  </button>
                  <div className="color-input-container">
                    <input
                      type="color"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      style={{ width: '32px', height: '32px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                    />
                    <input
                      type="text"
                      className="hex-text-input"
                      value={customColor}
                      onChange={(e) => setCustomColor(e.target.value)}
                      placeholder="#HEX"
                    />
                    <button
                      className="palette-btn"
                      onClick={() => addCustomColor(customColor)}
                      style={{ flex: '0 0 auto', padding: '0.5rem 0.75rem' }}
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Bulk Import Color List */}
                {showBulkImport ? (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    backgroundColor: 'rgba(255, 255, 255, 0.02)',
                    padding: '0.75rem',
                    borderRadius: '0.5rem',
                    border: '1px solid var(--border-color)'
                  }}>
                    <label className="control-label" style={{ fontSize: '0.75rem' }}>Paste HEX Codes</label>
                    <textarea
                      className="select-input"
                      rows="3"
                      style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: '0.75rem', padding: '0.4rem' }}
                      placeholder="Paste colors like: #ED0A3F, #FF681F, #BB3385 or ED0A3F FF681F"
                      value={bulkImportText}
                      onChange={(e) => setBulkImportText(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="palette-btn active" onClick={handleBulkImport} style={{ fontSize: '0.75rem' }}>
                        Import List
                      </button>
                      <button
                        className="palette-btn"
                        onClick={() => { setShowBulkImport(false); setBulkImportText(''); }}
                        style={{ fontSize: '0.75rem' }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button className="palette-btn" style={{ width: '100%' }} onClick={() => setShowBulkImport(true)}>
                    📥 Import HEX Code List / Group
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Section 3: Fine Tuning */}
          <div className="sidebar-section">
            <h2 className="section-title">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9M3 20h5M12 4h9M3 4h5M19 12h2M3 12h12M15 8V4m0 8v-4m-7 8v4m0-4h4" />
              </svg>
              3. Processing Settings
            </h2>
            
            <div className="control-group">
              <label className="control-label">
                Shape Smoothing (Contour Curves)
                <span className="control-value">{smoothingPasses} passes</span>
              </label>
              <input
                type="range"
                min="0"
                max="5"
                step="1"
                value={smoothingPasses}
                onChange={(e) => setSmoothingPasses(parseInt(e.target.value))}
              />
              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                Smooths out jagged edges. Set 2–4 passes for rounded, anime-style contours.
              </p>
            </div>

            <div className="control-group">
              <label className="control-label">
                Minimum Shape Area (Cleanup)
                <span className="control-value">{minFacetSize}px</span>
              </label>
              <input
                type="range"
                min="5"
                max="100"
                step="5"
                value={minFacetSize}
                onChange={(e) => setMinFacetSize(parseInt(e.target.value))}
              />
              <p style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                Absorbs details smaller than this pixel area into neighbors.
              </p>
            </div>
            
            <div className="control-group">
              <label className="control-label">
                Blueprint Number Font Size
                <span className="control-value">{fontSize}px</span>
              </label>
              <input
                type="range"
                min="6"
                max="16"
                step="1"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
              />
            </div>
          </div>

          {/* Generate Button */}
          {imageData && (
            <button
              className="btn-primary"
              disabled={isProcessing}
              onClick={() => processImage(null, k, minFacetSize, null, smoothingPasses)}
              style={{ marginTop: 'auto' }}
            >
              {isProcessing ? 'Processing Image...' : 'Process Image & Generate Outlines'}
            </button>
          )}
        </aside>

        {/* Workspace Canvas Panel */}
        <main className="workspace-center">
          {/* Tabs header */}
          <div className="workspace-tabs">
            {imageSrc ? (
              <div className="tabs-group">
                <button
                  className={`tab-btn ${activeTab === 'original' ? 'active' : ''}`}
                  onClick={() => setActiveTab('original')}
                >
                  Original Image
                </button>
                <button
                  className={`tab-btn ${activeTab === 'processed' ? 'active' : ''}`}
                  onClick={() => setActiveTab('processed')}
                >
                  Quantized Colors
                </button>
                <button
                  className={`tab-btn ${activeTab === 'outline' ? 'active' : ''}`}
                  onClick={() => setActiveTab('outline')}
                >
                  Numbered Outline
                </button>
              </div>
            ) : (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Please upload an image to start workspace
              </span>
            )}
            
            {result && activeTab === 'outline' && (
              <span style={{ fontSize: '0.8rem', color: 'var(--accent-color)', fontWeight: '500' }}>
                💡 Click a color in the palette to highlight its shapes!
              </span>
            )}
          </div>

          {/* Viewport Workspace */}
          <div
            ref={viewportRef}
            className="viewport"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            style={{ cursor: eyedropperActive ? 'crosshair' : (isDragging ? 'grabbing' : 'grab') }}
          >
            {imageSrc ? (
              <div
                className="viewport-canvas-container"
                onClick={handleCanvasClick}
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                  transition: isDragging ? 'none' : 'transform var(--transition-fast)'
                }}
              >
                <canvas ref={canvasRef} className="viewport-canvas" />
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">🎨</div>
                <h3>Start Your Custom Paint-by-Numbers</h3>
                <p>
                  Upload an image on the left. The app downscales, clusters colors, and smooths shapes directly in your browser.
                </p>
              </div>
            )}

            {/* Loading Indicator */}
            <div className={`loading-overlay ${isProcessing ? 'active' : ''}`}>
              <div className="spinner"></div>
              <div className="loading-text">{processingMsg}</div>
              <div className="progress-container">
                <div className="progress-bar" style={{ width: `${progress}%` }}></div>
              </div>
            </div>

            {/* Viewport Floating Controls */}
            {imageSrc && (
              <div className="viewport-controls">
                <span className="zoom-indicator">{Math.round(zoom * 100)}%</span>
                <button className="control-btn" onClick={() => handleZoom('in')} title="Zoom In">
                  ➕
                </button>
                <button className="control-btn" onClick={() => handleZoom('out')} title="Zoom Out">
                  ➖
                </button>
                <button className="control-btn" onClick={resetView} title="Reset Viewport">
                  🔄
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
