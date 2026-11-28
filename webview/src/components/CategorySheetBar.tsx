import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, Layers } from 'lucide-react';
import { useERDStore } from '../store/useERDStore.js';
import { useI18n } from '../i18n/translations.js';

export const CategorySheetBar: React.FC = () => {
  const { t } = useI18n();
  const categories = useERDStore((state) => state.diagram.categories || []);
  const selectedCategoryId = useERDStore(
    (state) => state.diagram.categorySettings?.selectedCategoryId ?? null
  );
  const lockEdit = useERDStore((state) => Boolean(state.diagram.lockEdit));
  const setCategorySettings = useERDStore((state) => state.setCategorySettings);
  const addCategory = useERDStore((state) => state.addCategory);
  const openCategoryModal = useERDStore((state) => state.openCategoryModal);

  const tabsRef = useRef<HTMLDivElement | null>(null);

  const scrollTabs = (delta: number) => {
    tabsRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <div className="no-print erd-sheet-bar" onContextMenu={(e) => e.stopPropagation()}>
      <div className="erd-sheet-nav">
        <button
          type="button"
          className="erd-sheet-nav-btn"
          onClick={() => scrollTabs(-160)}
          title="이전 탭"
          aria-label="Scroll tabs left"
        >
          <ChevronLeft size={14} />
        </button>
        <button
          type="button"
          className="erd-sheet-nav-btn"
          onClick={() => scrollTabs(160)}
          title="다음 탭"
          aria-label="Scroll tabs right"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div ref={tabsRef} className="erd-sheet-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={!selectedCategoryId}
          className={`erd-sheet-tab ${!selectedCategoryId ? 'active' : ''}`}
          onClick={() => setCategorySettings({ selectedCategoryId: null })}
          title={t('showAll')}
        >
          <Layers size={12} />
          <span>{t('sheetAll')}</span>
        </button>

        {categories.map((cat) => {
          const isActive = selectedCategoryId === cat.id;
          const c = cat.color || { r: 137, g: 180, b: 250 };
          const accent = `rgb(${c.r}, ${c.g}, ${c.b})`;
          const itemCount = (cat.nodeElementIds || []).length;

          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`erd-sheet-tab ${isActive ? 'active' : ''}`}
              style={
                isActive
                  ? { borderBottomColor: accent }
                  : undefined
              }
              onClick={() => setCategorySettings({ selectedCategoryId: cat.id })}
              onDoubleClick={() => {
                if (!lockEdit) openCategoryModal(cat);
              }}
              title={t('sheetEditHint')}
            >
              <span
                className="erd-sheet-tab-dot"
                style={{ backgroundColor: accent }}
              />
              <span className="erd-sheet-tab-label">{cat.name}</span>
              <span className="erd-sheet-tab-count">({itemCount})</span>
            </button>
          );
        })}

        <button
          type="button"
          className="erd-sheet-add-btn"
          disabled={lockEdit}
          onClick={() => addCategory()}
          title={t('sheetAddCategory')}
          aria-label={t('sheetAddCategory')}
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
};
