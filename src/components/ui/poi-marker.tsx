import React from 'react';
import { POI } from '@/types/note-types';

export const createPOIMarkerElement = (poi: POI) => {
  const el = document.createElement('div');
  el.className = 'poi-marker';
  el.style.position = 'relative';
  el.setAttribute('data-lat', poi.location.lat.toString());
  el.setAttribute('data-lon', poi.location.lon.toString());
  el.setAttribute('data-id', poi.id);

  const iconContainer = document.createElement('div');
  iconContainer.style.position = 'relative';
  iconContainer.style.backgroundColor = '#1f2937';
  iconContainer.style.padding = '8px';
  iconContainer.style.borderRadius = '8px';
  iconContainer.style.boxShadow = '0 2px 4px rgba(0,0,0,0.5)';
  iconContainer.style.width = 'fit-content';
  iconContainer.style.display = 'inline-block';
  iconContainer.style.cursor = 'pointer';

  // Create Material Icon
  const icon = document.createElement('span');
  icon.className = 'material-icons';
  icon.style.color = '#ffffff';
  icon.style.fontSize = '24px';
  icon.textContent = poi.warning ? 'report_problem' : POIIcons[poi.type];

  // Arrow pointer
  const arrow = document.createElement('div');
  arrow.style.position = 'absolute';
  arrow.style.bottom = '-6px';
  arrow.style.left = '50%';
  arrow.style.transform = 'translateX(-50%)';
  arrow.style.width = '0';
  arrow.style.height = '0';
  arrow.style.borderLeft = '6px solid transparent';
  arrow.style.borderRight = '6px solid transparent';
  arrow.style.borderTop = '6px solid #1f2937';

  // Category badge
  const badge = document.createElement('div');
  badge.style.position = 'absolute';
  badge.style.top = '-8px';
  badge.style.right = '-8px';
  badge.style.backgroundColor = '#e17055';
  badge.style.color = 'white';
  badge.style.borderRadius = '9999px';
  badge.style.padding = '2px 6px';
  badge.style.fontSize = '10px';
  badge.style.fontWeight = 'bold';
  badge.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
  badge.textContent = poi.warning ? 'Warning' : poi.category;

  iconContainer.appendChild(icon);
  iconContainer.appendChild(arrow);
  iconContainer.appendChild(badge);
  el.appendChild(iconContainer);

  return el;
};