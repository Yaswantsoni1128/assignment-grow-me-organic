import { useState, useEffect, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { OverlayPanel } from 'primereact/overlaypanel';
import { InputNumber } from 'primereact/inputnumber';
import { Button } from 'primereact/button';
import type { Artwork, ApiResponse } from '../types/artwork.ts';
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

function ArtWorkTable(){
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [rowsPerPage] = useState<number>(12);

  const [selectedRowIds, setSelectedRowIds] = useState<Set<number>>(new Set());
  const [selectCount, setSelectCount] = useState<number | null>(null);

  const overlayPanelRef = useRef<OverlayPanel>(null);

  const fetchArtworks = async (page: number) => {
    setLoading(true);
    try {
      const response = await fetch(
        `https://api.artic.edu/api/v1/artworks?page=${page}`
      );
      const data: ApiResponse = await response.json();
      
      setArtworks(data.data);
      setTotalRecords(data.pagination.total);
    } catch (error) {
      console.error('Error fetching artworks:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtworks(currentPage);
  }, [currentPage]);

  const onPageChange = (event: any) => {
    const newPage = event.page + 1;
    setCurrentPage(newPage);
  };


  const getSelectedArtworks = (): Artwork[] => {
    return artworks.filter(artwork => selectedRowIds.has(artwork.id));
  };

  const onSelectionChange = (e: any) => {
    const newSelection: Artwork[] = e.value;
    const newSelectedIds = new Set(selectedRowIds);
    
    const currentPageIds = new Set(artworks.map(a => a.id));
    
    currentPageIds.forEach(id => newSelectedIds.delete(id));
    
    newSelection.forEach(artwork => newSelectedIds.add(artwork.id));
    
    setSelectedRowIds(newSelectedIds);
  };

  const onSelectAllChange = (e: any) => {
    const newSelectedIds = new Set(selectedRowIds);
    
    if (e.checked) {
      artworks.forEach(artwork => newSelectedIds.add(artwork.id));
    } else {
      artworks.forEach(artwork => newSelectedIds.delete(artwork.id));
    }
    
    setSelectedRowIds(newSelectedIds);
  };


  const handleCustomRowSelection = () => {
    if (!selectCount || selectCount <= 0) {
      alert('Please enter a valid number');
      return;
    }

        const newSelectedIds = new Set<number>();

        const totalToSelect = Math.min(selectCount, totalRecords);
    
    for (let i = 1; i <= totalToSelect; i++) {
      const artworkIndex = i - 1;
      const pageNum = Math.floor(artworkIndex / rowsPerPage) + 1;
      const indexInPage = artworkIndex % rowsPerPage;
      
      if (pageNum === currentPage && indexInPage < artworks.length) {
        newSelectedIds.add(artworks[indexInPage].id);
      } else {
        const markerId = -(pageNum * 10000 + indexInPage);
        newSelectedIds.add(markerId);
      }
    }
    
    setSelectedRowIds(newSelectedIds);
    overlayPanelRef.current?.hide();
  };

  const handleClearAll = () => {
    setSelectedRowIds(new Set());
    setSelectCount(null);
  };

  useEffect(() => {
    const resolveSelectionMarkers = () => {
      const newSelectedIds = new Set(selectedRowIds);
      let hasChanges = false;
      
      selectedRowIds.forEach(id => {
        if (id < 0) {
          const pageNum = Math.floor(-id / 10000);
          const indexInPage = -id % 10000;
          
          if (pageNum === currentPage && indexInPage < artworks.length) {
            newSelectedIds.delete(id);
            newSelectedIds.add(artworks[indexInPage].id);
            hasChanges = true;
          }
        }
      });
      
      if (hasChanges) {
        setSelectedRowIds(newSelectedIds);
      }
    };
    
    if (artworks.length > 0) {
      resolveSelectionMarkers();
    }
  }, [artworks, currentPage]);


  const isAllSelected = artworks.length > 0 && 
    artworks.every(artwork => selectedRowIds.has(artwork.id));
  return (
    <div>
      <div>
        <h1 className='text-2xl font-bold mb-5'>Art Institute of Chicago - Artworks</h1>
        <div className='px-10 py-2 flex items-center justify-between'>
          <span className='text-lg font-semibold'>
            Selected: <span className='text-red-600'>{selectedRowIds.size}</span> row(s)
          </span>
          <Button
            label="Custom Selection"
            icon="pi pi-check-square"
            onClick={(e) => overlayPanelRef.current?.toggle(e)}
            className="custom-select-btn"
          />
          <Button
            label="Clear All"
            icon="pi pi-times"
            onClick={handleClearAll}
            className="bg-red-600"
            severity="danger"
          />
        </div>
      </div>

      <OverlayPanel ref={overlayPanelRef}>
        <div>
          <h3>Select Rows</h3>
          <p>Enter number of rows to select:</p>
          <InputNumber
            value={selectCount}
            onValueChange={(e) => setSelectCount(e.value ?? null)}
            placeholder="Enter count"
            min={0}
            max={totalRecords}
          />
          <Button
            label="Submit"
            icon="pi pi-check"
            onClick={handleCustomRowSelection}
          />
        </div>
      </OverlayPanel>

      <DataTable
        value={artworks}
        loading={loading}
        paginator
        rows={rowsPerPage}
        totalRecords={totalRecords}
        lazy
        first={(currentPage - 1) * rowsPerPage}
        onPage={onPageChange}
        selection={getSelectedArtworks()}
        onSelectionChange={onSelectionChange}
        dataKey="id"
        selectAll={isAllSelected}
        onSelectAllChange={onSelectAllChange}
        tableStyle={{ minWidth: '60rem' }}
        paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport"
        currentPageReportTemplate="Showing {first} to {last} of {totalRecords} entries"
      >
        <Column
          selectionMode="multiple"
          headerStyle={{ width: '3rem' }}
          frozen
        />
        <Column
          field="title"
          header="Title"
          style={{ minWidth: '200px' }}
          body={(rowData: Artwork) => rowData.title || 'N/A'}
        />
        <Column
          field="place_of_origin"
          header="Place of Origin"
          style={{ minWidth: '150px' }}
          body={(rowData: Artwork) => rowData.place_of_origin || 'N/A'}
        />
        <Column
          field="artist_display"
          header="Artist"
          style={{ minWidth: '200px' }}
          body={(rowData: Artwork) => rowData.artist_display || 'N/A'}
        />
        <Column
          field="inscriptions"
          header="Inscriptions"
          style={{ minWidth: '150px' }}
          body={(rowData: Artwork) => rowData.inscriptions || 'N/A'}
        />
        <Column
          field="date_start"
          header="Start Date"
          style={{ minWidth: '100px' }}
          body={(rowData: Artwork) => rowData.date_start || 'N/A'}
        />
        <Column
          field="date_end"
          header="End Date"
          style={{ minWidth: '100px' }}
          body={(rowData: Artwork) => rowData.date_end || 'N/A'}
        />
      </DataTable>
    </div>
  );
}

export default ArtWorkTable;