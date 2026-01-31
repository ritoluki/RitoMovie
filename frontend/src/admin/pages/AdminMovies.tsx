import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Pencil,
  Trash2,
  Star,
  Flame,
  Eye,
  Plus,
  Film,
} from 'lucide-react';
import adminService from '../services/adminService';
import DataTable, { Column } from '../components/common/DataTable';
import SearchInput from '../components/common/SearchInput';
import ConfirmDialog from '../components/common/ConfirmDialog';
import ActionDropdown from '../components/common/ActionDropdown';
import AdminBreadcrumb from '../components/layout/AdminBreadcrumb';
import type { AdminMovie, MovieQueryParams } from '../types/admin';

const AdminMovies: React.FC = () => {
  const queryClient = useQueryClient();

  // State
  const [queryParams, setQueryParams] = useState<MovieQueryParams>({
    page: 1,
    limit: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [search, setSearch] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    action: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    action: () => {},
  });

  // Fetch movies
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'movies', queryParams, search],
    queryFn: () => adminService.getMovies({ ...queryParams, search: search || undefined }),
  });

  // Fetch genres for filter
  const { data: genresData } = useQuery({
    queryKey: ['admin', 'genres'],
    queryFn: () => adminService.getGenres(),
  });

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminService.deleteMovie(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'movies'] });
    },
  });

  const featureMutation = useMutation({
    mutationFn: ({ id, isFeatured }: { id: string; isFeatured: boolean }) =>
      adminService.setMovieFeatured(id, isFeatured),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'movies'] });
    },
  });

  const trendingMutation = useMutation({
    mutationFn: ({ id, isTrending }: { id: string; isTrending: boolean }) =>
      adminService.setMovieTrending(id, isTrending),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'movies'] });
    },
  });

  // axios interceptor returns response.data directly, so structure is {success, data, pagination}
  const movies = data?.data || [];
  const pagination = data?.pagination;
  const genres = genresData?.data || [];

  // Handle actions
  const handleDeleteMovie = (movie: AdminMovie) => {
    setConfirmDialog({
      open: true,
      title: 'Delete Movie',
      message: `Are you sure you want to delete "${movie.title}"? This will also delete all associated comments and ratings.`,
      action: () => {
        deleteMutation.mutate(movie._id);
        setConfirmDialog((prev) => ({ ...prev, open: false }));
      },
    });
  };

  // Table columns
  const columns: Column<AdminMovie>[] = [
    {
      key: 'title',
      header: 'Movie',
      sortable: true,
      render: (movie) => (
        <div className="flex items-center space-x-3">
          {movie.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
              alt={movie.title}
              className="w-10 h-14 rounded object-cover"
            />
          ) : (
            <div className="w-10 h-14 rounded bg-gray-700 flex items-center justify-center">
              <Film className="w-5 h-5 text-gray-500" />
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white font-medium truncate max-w-xs">{movie.title}</p>
            {movie.original_title && movie.original_title !== movie.title && (
              <p className="text-gray-400 text-xs truncate">{movie.original_title}</p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'release_date',
      header: 'Year',
      sortable: true,
      width: '80px',
      render: (movie) => (
        <span className="text-gray-300">
          {movie.release_date ? new Date(movie.release_date).getFullYear() : '-'}
        </span>
      ),
    },
    {
      key: 'genres',
      header: 'Genres',
      render: (movie) => (
        <div className="flex flex-wrap gap-1 max-w-xs">
          {movie.genres?.slice(0, 2).map((genre, idx) => (
            <span
              key={idx}
              className="px-2 py-0.5 text-xs bg-gray-700 text-gray-300 rounded"
            >
              {genre}
            </span>
          ))}
          {movie.genres?.length > 2 && (
            <span className="text-xs text-gray-500">+{movie.genres.length - 2}</span>
          )}
        </div>
      ),
    },
    {
      key: 'vote_average',
      header: 'Rating',
      sortable: true,
      width: '100px',
      render: (movie) => (
        <div className="flex items-center space-x-1">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="text-gray-300">{movie.vote_average?.toFixed(1) || '-'}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (movie) => (
        <div className="flex items-center space-x-2">
          {movie.isFeatured && (
            <span className="px-2 py-0.5 text-xs bg-purple-900/50 text-purple-300 rounded">
              Featured
            </span>
          )}
          {movie.isTrending && (
            <span className="px-2 py-0.5 text-xs bg-orange-900/50 text-orange-300 rounded">
              Trending
            </span>
          )}
          {!movie.isFeatured && !movie.isTrending && (
            <span className="text-gray-500 text-xs">-</span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '80px',
      render: (movie) => (
        <ActionDropdown
          actions={[
            {
              label: 'View Details',
              icon: <Eye className="h-5 w-5" />,
              onClick: () => console.log('View', movie._id),
            },
            {
              label: 'Edit Movie',
              icon: <Pencil className="h-5 w-5" />,
              onClick: () => console.log('Edit', movie._id),
            },
            {
              label: movie.isFeatured ? 'Remove from Featured' : 'Set as Featured',
              icon: <Star className="h-5 w-5" />,
              onClick: () => featureMutation.mutate({ id: movie._id, isFeatured: !movie.isFeatured }),
            },
            {
              label: movie.isTrending ? 'Remove from Trending' : 'Set as Trending',
              icon: <Flame className="h-5 w-5" />,
              onClick: () => trendingMutation.mutate({ id: movie._id, isTrending: !movie.isTrending }),
            },
            {
              label: 'Delete Movie',
              icon: <Trash2 className="h-5 w-5" />,
              onClick: () => handleDeleteMovie(movie),
              variant: 'danger',
            },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <AdminBreadcrumb items={[{ label: 'Admin', href: '/admin' }, { label: 'Movies' }]} />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Movies</h1>
          <p className="text-gray-400 mt-1">Manage movie content</p>
        </div>
        <button className="mt-4 sm:mt-0 flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
          <Plus className="h-5 w-5 mr-2" />
          Add Movie
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search movies..."
          className="sm:w-64"
        />

        <select
          value={queryParams.genre || ''}
          onChange={(e) => setQueryParams({ ...queryParams, genre: e.target.value || undefined, page: 1 })}
          className="px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
        >
          <option value="">All Genres</option>
          {genres.map((genre) => (
            <option key={genre._id} value={genre._id}>
              {genre._id} ({genre.count})
            </option>
          ))}
        </select>

        <select
          value={queryParams.status || ''}
          onChange={(e) => setQueryParams({ ...queryParams, status: e.target.value as 'featured' | 'trending' | undefined, page: 1 })}
          className="px-3 py-2 bg-[#2a2a2a] border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-red-500"
        >
          <option value="">All Status</option>
          <option value="featured">Featured</option>
          <option value="trending">Trending</option>
        </select>
      </div>

      {/* Bulk actions */}
      {selectedRows.length > 0 && (
        <div className="flex items-center gap-4 mb-4 p-4 bg-[#2a2a2a] rounded-lg">
          <span className="text-sm text-gray-300">
            {selectedRows.length} movie(s) selected
          </span>
          <button className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700">
            Set Featured
          </button>
          <button className="px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700">
            Set Trending
          </button>
          <button className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700">
            Delete Selected
          </button>
          <button
            onClick={() => setSelectedRows([])}
            className="px-3 py-1.5 text-sm text-gray-400 hover:text-white"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={movies}
        loading={isLoading}
        pagination={pagination}
        onPageChange={(page) => setQueryParams({ ...queryParams, page })}
        onSort={(key, order) => setQueryParams({ ...queryParams, sortBy: key, sortOrder: order })}
        sortBy={queryParams.sortBy}
        sortOrder={queryParams.sortOrder}
        selectable
        selectedRows={selectedRows}
        onSelectRows={setSelectedRows}
        emptyMessage="No movies found"
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.open}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, open: false }))}
        onConfirm={confirmDialog.action}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant="danger"
        loading={deleteMutation.isPending}
      />
    </div>
  );
};

export default AdminMovies;
