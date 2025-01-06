import emitter from '../emitters/basic';

export function showInsight(event: MouseEvent, data: any = {}, options: any = {}) {
  event.stopPropagation();
  event.preventDefault();
  const targetElem = event.currentTarget as HTMLElement;
  if (!targetElem) return;

  const id = targetElem.getAttribute('insightId') || '';
  const targetRect = targetElem.getBoundingClientRect();
  const positionAttr = targetElem.getAttribute('position') || '';
  const alignAttr = targetElem.getAttribute('align') || '';
  
  const { item, previousItem } = data;

  let x = 0;
  let y = 0;
  let width: number | null = null;
  let positionAt: 'top' | 'bottom' | 'left' | 'right' = 'bottom';
  let alignTo: 'top' | 'bottom' | 'left' | 'right' | 'center' = 'left';

  let arrowX = 0;
  let arrowY = 0;

  if (alignAttr === 'grandparent') {
    const grandparentElem = targetElem.parentElement?.parentElement;
    if (!grandparentElem) return;
    const grandparentRect = grandparentElem.getBoundingClientRect();
    x = grandparentRect.left;
    width = grandparentRect.width + 3;
    arrowX = (targetRect.left - grandparentRect.left) + (targetRect.width / 2);

  } else if (alignAttr === 'right' || positionAttr === 'right') {
    alignTo = alignAttr === 'right' ? 'right' : alignTo;
    x = targetRect.left + targetRect.width;
    arrowX = targetRect.width / 2;

  } else if (alignAttr === 'center') {
    alignTo = 'center';
    x = targetRect.left + (targetRect.width / 2);
    arrowX = targetRect.width / 2;

  } else {
    x = targetRect.left;
    arrowX = targetRect.width / 2;
    alignTo = (alignAttr as any) || alignTo;
  }

  if (positionAttr === 'top') {
    positionAt = 'top';
    y = targetRect.top;
  } else if (['left', 'right'].includes(positionAttr)) {
    positionAt = positionAttr as 'left' | 'right';
    y = targetRect.top + (targetRect.height / 2);
    arrowX = 0;
  } else {
    positionAt = 'bottom';
    y = targetRect.top + targetRect.height;
  }
    
  if (options.shiftY) {
    y += options.shiftY;
  }

  emitter.emit('showInsight', { id, x, y, width, positionAt, arrowX, arrowY, alignTo, item, previousItem });
}

export function hideInsight() {
  emitter.emit('hideInsight');
}