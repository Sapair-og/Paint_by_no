// pbnWorker.js - Web Worker for Paint-by-Numbers Image Processing

self.onmessage = function (e) {
  const { action, imageData, k, minFacetSize, customPalette, smoothingPasses } = e.data;

  if (action === 'process') {
    try {
      const { data, width, height } = imageData;
      
      // Step 1: Establish Palette
      self.postMessage({ status: 'progress', message: 'Analyzing colors...', progress: 10 });
      let paletteHex = [];
      if (customPalette && customPalette.length > 0) {
        paletteHex = customPalette;
      } else {
        paletteHex = runKMeans(data, k);
      }
      
      const paletteRGB = paletteHex.map(hexToRgb);
      
      // Step 2: Map pixels to palette
      self.postMessage({ status: 'progress', message: 'Quantizing image pixels...', progress: 30 });
      const colorIndices = mapPixelsToPalette(data, paletteRGB);
      
      // Step 2.5: Smooth shapes (Majority filter to remove stair-step jaggedness)
      const passes = typeof smoothingPasses === 'number' ? smoothingPasses : 2;
      if (passes > 0) {
        self.postMessage({ status: 'progress', message: 'Smoothing shapes & boundaries...', progress: 40 });
        smoothColorIndices(colorIndices, width, height, passes);
      }
      
      // Step 3: Cleanup Facets (Iterative smoothing of tiny regions)
      self.postMessage({ status: 'progress', message: 'Cleaning up tiny details...', progress: 50 });
      cleanupFacets(colorIndices, width, height, minFacetSize);
      
      // Step 4: Final Labeling & Outline Generation
      self.postMessage({ status: 'progress', message: 'Tracing boundaries & placing labels...', progress: 75 });
      const { componentIds, components } = labelComponents(colorIndices, width, height);
      
      // Generate Quantized Image Data
      const quantizedData = new Uint8ClampedArray(data.length);
      for (let i = 0; i < colorIndices.length; i++) {
        const cIdx = colorIndices[i];
        const rgb = paletteRGB[cIdx];
        const idx = i * 4;
        quantizedData[idx] = rgb[0];
        quantizedData[idx + 1] = rgb[1];
        quantizedData[idx + 2] = rgb[2];
        quantizedData[idx + 3] = 255;
      }
      
      // Generate Outline Image Data (white background, black borders)
      const outlineData = new Uint8ClampedArray(data.length);
      outlineData.fill(255); // Init all white
      
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const idx = y * width + x;
          const compId = componentIds[idx];
          
          // Draw border if neighbor belongs to different component
          let isBorder = false;
          
          // Right neighbor
          if (x < width - 1) {
            if (componentIds[idx + 1] !== compId) isBorder = true;
          }
          // Bottom neighbor
          if (y < height - 1) {
            if (componentIds[idx + width] !== compId) isBorder = true;
          }
          
          if (isBorder) {
            const outIdx = idx * 4;
            outlineData[outIdx] = 0;     // R
            outlineData[outIdx + 1] = 0; // G
            outlineData[outIdx + 2] = 0; // B
            outlineData[outIdx + 3] = 255; // A
          }
        }
      }
      
      // Draw outer canvas borders for neatness
      for (let x = 0; x < width; x++) {
        // Bottom edge
        const bIdx = ((height - 1) * width + x) * 4;
        outlineData[bIdx] = outlineData[bIdx+1] = outlineData[bIdx+2] = 0;
      }
      for (let y = 0; y < height; y++) {
        // Right edge
        const rIdx = (y * width + width - 1) * 4;
        outlineData[rIdx] = outlineData[rIdx+1] = outlineData[rIdx+2] = 0;
      }
      
      // Step 5: Centroids for labeling
      const labels = [];
      for (let c = 0; c < components.length; c++) {
        const comp = components[c];
        
        // Skip label if component is extremely small (can be adjusted by caller)
        // Calculate centroid
        let sumX = 0;
        let sumY = 0;
        for (let p = 0; p < comp.pixels.length; p++) {
          const pIdx = comp.pixels[p];
          sumX += pIdx % width;
          sumY += Math.floor(pIdx / width);
        }
        
        const cx = Math.round(sumX / comp.pixels.length);
        const cy = Math.round(sumY / comp.pixels.length);
        
        // Ensure centroid falls within component; if not, find the closest pixel inside
        let targetX = cx;
        let targetY = cy;
        const centerIdx = cy * width + cx;
        
        if (centerIdx < 0 || centerIdx >= componentIds.length || componentIds[centerIdx] !== comp.id) {
          let minDist = Infinity;
          for (let p = 0; p < comp.pixels.length; p++) {
            const pIdx = comp.pixels[p];
            const px = pIdx % width;
            const py = Math.floor(pIdx / width);
            const dist = (px - cx) ** 2 + (py - cy) ** 2;
            if (dist < minDist) {
              minDist = dist;
              targetX = px;
              targetY = py;
            }
          }
        }
        
        labels.push({
          x: targetX,
          y: targetY,
          number: comp.colorIndex + 1,
          colorIndex: comp.colorIndex,
          size: comp.pixels.length
        });
      }
      
      self.postMessage({ status: 'progress', message: 'Finalizing...', progress: 95 });
      
      // Post result back with Transferables to save memory/time
      self.postMessage({
        status: 'complete',
        result: {
          palette: paletteHex,
          quantizedData,
          outlineData,
          labels,
          width,
          height
        }
      }, [quantizedData.buffer, outlineData.buffer]);
      
    } catch (err) {
      self.postMessage({ status: 'error', error: err.message });
    }
  }
};

// --- Helper Math Algorithms ---

function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  }).join("");
}

function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

// Basic K-Means clustering in RGB space
function runKMeans(pixels, k, maxIterations = 15) {
  // Extract pixels (downsampled for speed)
  const rgbPixels = [];
  const step = Math.max(1, Math.floor(pixels.length / 4 / 3000)); // target ~3000 sample pixels
  
  for (let i = 0; i < pixels.length; i += 4 * step) {
    rgbPixels.push([pixels[i], pixels[i+1], pixels[i+2]]);
  }
  
  if (rgbPixels.length === 0) return [];
  
  // Choose k initial centroids randomly from distinct pixels
  const centroids = [];
  const usedIndices = new Set();
  
  while (centroids.length < k && usedIndices.size < rgbPixels.length) {
    const idx = Math.floor(Math.random() * rgbPixels.length);
    if (!usedIndices.has(idx)) {
      usedIndices.add(idx);
      centroids.push([...rgbPixels[idx]]);
    }
  }
  
  // Pad if needed
  while (centroids.length < k) {
    centroids.push([Math.floor(Math.random() * 256), Math.floor(Math.random() * 256), Math.floor(Math.random() * 256)]);
  }
  
  const assignments = new Int32Array(rgbPixels.length);
  let changed = true;
  let iterations = 0;
  
  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    
    // 1. Assign to nearest centroid
    for (let i = 0; i < rgbPixels.length; i++) {
      const p = rgbPixels[i];
      let minDist = Infinity;
      let minIdx = 0;
      
      for (let c = 0; c < k; c++) {
        const cent = centroids[c];
        const dist = (p[0] - cent[0]) ** 2 + (p[1] - cent[1]) ** 2 + (p[2] - cent[2]) ** 2;
        if (dist < minDist) {
          minDist = dist;
          minIdx = c;
        }
      }
      
      if (assignments[i] !== minIdx) {
        assignments[i] = minIdx;
        changed = true;
      }
    }
    
    // 2. Update centroids
    const newCentroids = Array.from({ length: k }, () => [0, 0, 0, 0]); // sumR, sumG, sumB, count
    
    for (let i = 0; i < rgbPixels.length; i++) {
      const c = assignments[i];
      newCentroids[c][0] += rgbPixels[i][0];
      newCentroids[c][1] += rgbPixels[i][1];
      newCentroids[c][2] += rgbPixels[i][2];
      newCentroids[c][3]++;
    }
    
    for (let c = 0; c < k; c++) {
      const count = newCentroids[c][3];
      if (count > 0) {
        centroids[c] = [
          Math.round(newCentroids[c][0] / count),
          Math.round(newCentroids[c][1] / count),
          Math.round(newCentroids[c][2] / count)
        ];
      }
    }
  }
  
  return centroids.map(c => rgbToHex(c[0], c[1], c[2]));
}

// Maps each pixel to the nearest palette color
function mapPixelsToPalette(pixels, paletteRGB) {
  const size = pixels.length / 4;
  const colorIndices = new Int32Array(size);
  
  for (let i = 0; i < size; i++) {
    const idx = i * 4;
    const r = pixels[idx];
    const g = pixels[idx + 1];
    const b = pixels[idx + 2];
    
    let minDist = Infinity;
    let minIdx = 0;
    
    for (let c = 0; c < paletteRGB.length; c++) {
      const pal = paletteRGB[c];
      const dist = (r - pal[0]) ** 2 + (g - pal[1]) ** 2 + (b - pal[2]) ** 2;
      if (dist < minDist) {
        minDist = dist;
        minIdx = c;
      }
    }
    
    colorIndices[i] = minIdx;
  }
  
  return colorIndices;
}

// Connected Component Labeling using 4-connectivity (Stack-based)
function labelComponents(colorIndices, width, height) {
  const size = width * height;
  const componentIds = new Int32Array(size).fill(-1);
  let componentCount = 0;
  
  const components = [];
  const stack = new Int32Array(size); // preallocated stack
  
  for (let i = 0; i < size; i++) {
    if (componentIds[i] !== -1) continue;
    
    const colorIndex = colorIndices[i];
    const compId = componentCount++;
    let stackPtr = 0;
    
    stack[stackPtr++] = i;
    componentIds[i] = compId;
    
    const compPixels = [];
    
    while (stackPtr > 0) {
      const curr = stack[--stackPtr];
      compPixels.push(curr);
      
      const cx = curr % width;
      const cy = Math.floor(curr / width);
      
      // Check 4-connected neighbors
      // Left
      if (cx > 0) {
        const nIdx = curr - 1;
        if (componentIds[nIdx] === -1 && colorIndices[nIdx] === colorIndex) {
          componentIds[nIdx] = compId;
          stack[stackPtr++] = nIdx;
        }
      }
      // Right
      if (cx < width - 1) {
        const nIdx = curr + 1;
        if (componentIds[nIdx] === -1 && colorIndices[nIdx] === colorIndex) {
          componentIds[nIdx] = compId;
          stack[stackPtr++] = nIdx;
        }
      }
      // Top
      if (cy > 0) {
        const nIdx = curr - width;
        if (componentIds[nIdx] === -1 && colorIndices[nIdx] === colorIndex) {
          componentIds[nIdx] = compId;
          stack[stackPtr++] = nIdx;
        }
      }
      // Bottom
      if (cy < height - 1) {
        const nIdx = curr + width;
        if (componentIds[nIdx] === -1 && colorIndices[nIdx] === colorIndex) {
          componentIds[nIdx] = compId;
          stack[stackPtr++] = nIdx;
        }
      }
    }
    
    components.push({
      id: compId,
      colorIndex: colorIndex,
      pixels: compPixels,
      size: compPixels.length
    });
  }
  
  return { componentIds, components };
}

// Facet cleanup: re-colors components smaller than minFacetSize with their dominant neighbor's color
function cleanupFacets(colorIndices, width, height, minFacetSize) {
  let passes = 0;
  const maxPasses = 3;
  let changed = true;
  
  while (changed && passes < maxPasses) {
    changed = false;
    passes++;
    
    const { componentIds, components } = labelComponents(colorIndices, width, height);
    
    for (let c = 0; c < components.length; c++) {
      const comp = components[c];
      if (comp.size >= minFacetSize) continue;
      
      // Gather colors of neighbor pixels
      const neighborColors = {};
      
      for (let p = 0; p < comp.pixels.length; p++) {
        const idx = comp.pixels[p];
        const cx = idx % width;
        const cy = Math.floor(idx / width);
        
        const neighbors = [];
        if (cx > 0) neighbors.push(idx - 1);
        if (cx < width - 1) neighbors.push(idx + 1);
        if (cy > 0) neighbors.push(idx - width);
        if (cy < height - 1) neighbors.push(idx + width);
        
        for (let n = 0; n < neighbors.length; n++) {
          const nIdx = neighbors[n];
          const nCompId = componentIds[nIdx];
          if (nCompId !== comp.id) {
            const nColor = colorIndices[nIdx];
            neighborColors[nColor] = (neighborColors[nColor] || 0) + 1;
          }
        }
      }
      
      // Find neighbor color with highest pixel frequency
      let maxCount = -1;
      let bestColor = -1;
      for (const col in neighborColors) {
        const count = neighborColors[col];
        if (count > maxCount) {
          maxCount = count;
          bestColor = parseInt(col);
        }
      }
      
      // Re-color component pixels
      if (bestColor !== -1 && bestColor !== comp.colorIndex) {
        for (let p = 0; p < comp.pixels.length; p++) {
          colorIndices[comp.pixels[p]] = bestColor;
        }
        changed = true;
      }
    }
  }
}

// 5x5 Majority / Modal Filter to smooth edges and round off corners
function smoothColorIndices(colorIndices, width, height, passes) {
  const temp = new Int32Array(colorIndices.length);
  let current = colorIndices;
  const radius = 2; // 5x5 window
  
  for (let p = 0; p < passes; p++) {
    for (let y = 0; y < height; y++) {
      const yMin = Math.max(0, y - radius);
      const yMax = Math.min(height - 1, y + radius);
      
      for (let x = 0; x < width; x++) {
        const xMin = Math.max(0, x - radius);
        const xMax = Math.min(width - 1, x + radius);
        
        const counts = {};
        for (let ny = yMin; ny <= yMax; ny++) {
          const rowOffset = ny * width;
          for (let nx = xMin; nx <= xMax; nx++) {
            const col = current[rowOffset + nx];
            counts[col] = (counts[col] || 0) + 1;
          }
        }
        
        let maxCount = -1;
        let dominantColor = current[y * width + x];
        for (const col in counts) {
          const count = counts[col];
          if (count > maxCount) {
            maxCount = count;
            dominantColor = parseInt(col);
          }
        }
        temp[y * width + x] = dominantColor;
      }
    }
    // Copy temp to current for the next pass
    current.set(temp);
  }
}

