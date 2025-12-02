import React, { useEffect, useRef } from 'react';
import { getProvinceCodeBySvgId } from '../../../data/provinceMapping';

interface Props {
  selectedProvince: string | null;
  onProvinceClick: (code: string) => void;
}

export const VietnamMapSVG: React.FC<Props> = ({ selectedProvince, onProvinceClick }) => {
  const svgRef = useRef<HTMLDivElement>(null);
  const handlersAttached = useRef(false);
  const onProvinceClickRef = useRef(onProvinceClick);

  // Keep ref updated
  useEffect(() => {
    onProvinceClickRef.current = onProvinceClick;
  }, [onProvinceClick]);

  useEffect(() => {
    if (!svgRef.current) return;

    // Load and inject SVG
    fetch('/vn.svg')
      .then(res => res.text())
      .then(text => {
        if (!svgRef.current) return;
        
        // Clear previous content
        svgRef.current.innerHTML = text;
        const svg = svgRef.current.querySelector('svg');
        if (!svg) {
          console.error('SVG element not found');
          return;
        }

        // Make SVG responsive
        svg.setAttribute('width', '100%');
        svg.removeAttribute('height'); // Remove height attribute, use CSS instead
        svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
        svg.style.height = 'auto';
        svg.style.maxHeight = '600px';

        // First, reset ALL paths to default gray color
        const allPaths = svg.querySelectorAll('path');
        allPaths.forEach((pathEl) => {
          const path = pathEl as SVGPathElement;
          path.setAttribute('fill', '#e5e7eb');
          path.setAttribute('stroke', '#fff');
          path.setAttribute('stroke-width', '1');
        });

        // Get all paths with IDs
        const paths = svg.querySelectorAll('path[id]');
        console.log(`Found ${paths.length} paths with IDs`);
        
        paths.forEach((pathEl, index) => {
          const path = pathEl as SVGPathElement;
          const svgId = path.getAttribute('id');
          if (!svgId) {
            console.warn(`Path ${index} has no ID`);
            return;
          }

          const provinceCode = getProvinceCodeBySvgId(svgId);
          if (!provinceCode) {
            // Skip regions (VN39, VN53, VN66 are regions, not provinces)
            if (!['VN39', 'VN53', 'VN66'].includes(svgId)) {
              console.warn(`No mapping found for SVG ID: ${svgId}`);
            }
            // Keep default gray for unmapped paths
            return;
          }

          // Set initial styles (ensure gray, even if SVG has different color)
          path.setAttribute('fill', '#e5e7eb');
          path.setAttribute('stroke', '#fff');
          path.setAttribute('stroke-width', '1');
          path.style.cursor = 'pointer';
          path.style.transition = 'all 0.2s ease';
          path.setAttribute('data-province-code', provinceCode);

          // Click handler
          const handleClick = (e: Event) => {
            const mouseEvent = e as MouseEvent;
            mouseEvent.preventDefault();
            mouseEvent.stopPropagation();
            console.log('Map clicked:', { svgId, provinceCode });
            onProvinceClickRef.current(provinceCode);
          };

          path.addEventListener('click', handleClick);

          // Hover effects - only if not selected
          path.addEventListener('mouseenter', () => {
            const currentSelected = svg.getAttribute('data-selected-province');
            if (currentSelected !== provinceCode) {
              path.setAttribute('fill', '#d1d5db');
            }
          });

          path.addEventListener('mouseleave', () => {
            const currentSelected = svg.getAttribute('data-selected-province');
            if (currentSelected !== provinceCode) {
              path.setAttribute('fill', '#e5e7eb');
            }
          });
        });

        handlersAttached.current = true;
        console.log('SVG handlers attached');
        
        // Initial update
        updateSelectedProvince(svg, selectedProvince);
      })
      .catch(err => {
        console.error('Failed to load SVG:', err);
        if (svgRef.current) {
          svgRef.current.innerHTML = '<div class="text-center text-gray-500 p-8">Không thể tải bản đồ</div>';
        }
      });
  }, []); // Only run once on mount

  // Update styling when selected province changes
  useEffect(() => {
    if (!svgRef.current || !handlersAttached.current) return;
    const svg = svgRef.current.querySelector('svg');
    if (!svg) return;
    updateSelectedProvince(svg, selectedProvince);
  }, [selectedProvince]);

  const updateSelectedProvince = (svg: SVGElement, selectedCode: string | null) => {
    // Store selected province in SVG element for hover logic
    if (selectedCode) {
      svg.setAttribute('data-selected-province', selectedCode);
    } else {
      svg.removeAttribute('data-selected-province');
    }

    // Get ALL paths, not just those with data-province-code
    const allPaths = svg.querySelectorAll('path');
    
    allPaths.forEach((pathEl) => {
      const path = pathEl as SVGPathElement;
      const provinceCode = path.getAttribute('data-province-code');
      
      // If path has province code and matches selected, highlight it
      if (provinceCode && selectedCode === provinceCode) {
        // Selected province - green
        path.setAttribute('fill', '#10b981');
        path.setAttribute('stroke', '#059669');
        path.setAttribute('stroke-width', '2');
      } else {
        // Not selected or no province code - gray (default)
        path.setAttribute('fill', '#e5e7eb');
        path.setAttribute('stroke', '#fff');
        path.setAttribute('stroke-width', '1');
      }
    });
  };

  return (
    <div className="w-full bg-white rounded-lg shadow-sm p-4">
      <div
        ref={svgRef}
        className="w-full flex items-center justify-center min-h-[400px]"
      >
        <div className="text-gray-500">Đang tải bản đồ...</div>
      </div>
    </div>
  );
};
