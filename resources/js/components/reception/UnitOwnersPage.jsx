import { useCallback, useEffect, useState } from 'react';
import {
    Box, Typography, Button, TextField, InputAdornment,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
    IconButton, Tooltip, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
    CircularProgress, Snackbar, Alert, MenuItem, Select, FormControl,
    InputLabel, Divider,
} from '@mui/material';
import AddIcon       from '@mui/icons-material/Add';
import EditIcon      from '@mui/icons-material/Edit';
import DeleteIcon    from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import SearchIcon    from '@mui/icons-material/Search';
import TopBar        from '../common/TopBar';
import api           from '../../services/api';
import IncomingCallDialog from './IncomingCallDialog';
import OutgoingCallDialog from './OutgoingCallDialog';

// ── helpers ──────────────────────────────────────────────────────────────────

const EMPTY_UNIT = { unit_number: '', floor: '', building: '', owner_name: '', status: 'active' };
const EMPTY_ACCOUNT = { name: '', email: '', password: '' };

function StatusChip({ status }) {
    return (
        <Chip
            label={status === 'active' ? 'Active' : 'Inactive'}
            size="small"
            sx={{
                fontWeight: 600, fontSize: '0.7rem', height: 22,
                bgcolor: status === 'active' ? '#dcfce7' : '#f3f4f6',
                color:   status === 'active' ? '#15803d' : '#6b7280',
                border:  `1px solid ${status === 'active' ? '#86efac' : '#d1d5db'}`,
            }}
        />
    );
}

function AccountChip({ owner }) {
    if (!owner) {
        return (
            <Chip
                label="No account"
                size="small"
                sx={{
                    fontWeight: 600, fontSize: '0.7rem', height: 22,
                    bgcolor: '#fef9c3', color: '#854d0e',
                    border: '1px solid #fde68a',
                }}
            />
        );
    }
    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, lineHeight: 1.2 }}>
                {owner.name}
            </Typography>
            <Typography sx={{ fontSize: '0.7rem', color: 'text.secondary', lineHeight: 1.2 }}>
                {owner.email}
            </Typography>
        </Box>
    );
}

// ── Unit form dialog ──────────────────────────────────────────────────────────

function UnitDialog({ open, unit, onClose, onSaved }) {
    const isEdit = !!unit?.id;
    const [form, setForm] = useState(EMPTY_UNIT);
    const [saving, setSaving] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (open) {
            setForm(unit ? {
                unit_number: unit.unit_number || '',
                floor:       unit.floor       || '',
                building:    unit.building    || '',
                owner_name:  unit.owner_name  || '',
                status:      unit.status      || 'active',
            } : EMPTY_UNIT);
            setErrors({});
        }
    }, [open, unit]);

    const field = (key) => ({
        value: form[key],
        onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
        error: !!errors[key],
        helperText: errors[key],
    });

    const handleSave = async () => {
        setSaving(true);
        setErrors({});
        try {
            const res = isEdit
                ? await api.put(`/units/${unit.id}`, form)
                : await api.post('/units', form);
            onSaved(res.data.data, isEdit);
            onClose();
        } catch (e) {
            if (e.response?.status === 422) {
                const raw = e.response.data.errors || {};
                setErrors(Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v[0]])));
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                {isEdit ? 'Edit Unit' : 'Add Unit'}
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField label="Unit Number" size="small" required fullWidth {...field('unit_number')} />
                <Box sx={{ display: 'flex', gap: 1.5 }}>
                    <TextField label="Floor" size="small" fullWidth {...field('floor')} />
                    <TextField label="Building" size="small" fullWidth {...field('building')} />
                </Box>
                <TextField label="Owner Name" size="small" required fullWidth {...field('owner_name')} />
                <FormControl size="small" fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select label="Status" value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                        <MenuItem value="active">Active</MenuItem>
                        <MenuItem value="inactive">Inactive</MenuItem>
                    </Select>
                </FormControl>
            </DialogContent>
            <Divider />
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} disabled={saving}>Cancel</Button>
                <Button variant="contained" onClick={handleSave} disabled={saving}
                    startIcon={saving && <CircularProgress size={14} color="inherit" />}>
                    {saving ? 'Saving…' : 'Save'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ── Owner account dialog ──────────────────────────────────────────────────────

function AccountDialog({ open, unit, onClose, onSaved }) {
    const hasAccount = !!unit?.owner;
    const [form, setForm]       = useState(EMPTY_ACCOUNT);
    const [saving, setSaving]   = useState(false);
    const [removing, setRemoving] = useState(false);
    const [errors, setErrors]   = useState({});

    useEffect(() => {
        if (open && unit) {
            setForm(hasAccount
                ? { name: unit.owner.name, email: unit.owner.email, password: '' }
                : { ...EMPTY_ACCOUNT, name: unit.owner_name || '' }
            );
            setErrors({});
        }
    }, [open, unit]);

    const field = (key) => ({
        value: form[key],
        onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
        error: !!errors[key],
        helperText: errors[key],
    });

    const handleSave = async () => {
        setSaving(true);
        setErrors({});
        try {
            const payload = { ...form };
            if (hasAccount && !payload.password) delete payload.password;
            const res = hasAccount
                ? await api.put(`/units/${unit.id}/owner`, payload)
                : await api.post(`/units/${unit.id}/owner`, payload);
            onSaved(unit.id, res.data.data);
            onClose();
        } catch (e) {
            if (e.response?.status === 422) {
                const raw = e.response.data.errors || {};
                setErrors(Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v[0]])));
            }
        } finally {
            setSaving(false);
        }
    };

    const handleRemove = async () => {
        setRemoving(true);
        try {
            await api.delete(`/units/${unit.id}/owner`);
            onSaved(unit.id, null);
            onClose();
        } catch {}
        finally { setRemoving(false); }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
                {hasAccount ? 'Edit Login Account' : 'Create Login Account'}
            </DialogTitle>
            <Divider />
            <DialogContent sx={{ pt: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Typography variant="caption" color="text.secondary">
                    Unit {unit?.unit_number} — {unit?.owner_name}
                </Typography>
                <TextField label="Full Name" size="small" required fullWidth {...field('name')} />
                <TextField label="Email" size="small" required fullWidth type="email" {...field('email')} />
                <TextField
                    label={hasAccount ? 'New Password (leave blank to keep)' : 'Password'}
                    size="small" fullWidth type="password"
                    required={!hasAccount}
                    {...field('password')}
                />
            </DialogContent>
            <Divider />
            <DialogActions sx={{ px: 3, py: 2, justifyContent: 'space-between' }}>
                <Box>
                    {hasAccount && (
                        <Button
                            color="error" onClick={handleRemove} disabled={removing || saving}
                            startIcon={removing ? <CircularProgress size={14} color="inherit" /> : <PersonOffIcon fontSize="small" />}
                        >
                            {removing ? 'Removing…' : 'Remove Account'}
                        </Button>
                    )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button onClick={onClose} disabled={saving || removing}>Cancel</Button>
                    <Button variant="contained" onClick={handleSave} disabled={saving || removing}
                        startIcon={saving && <CircularProgress size={14} color="inherit" />}>
                        {saving ? 'Saving…' : 'Save'}
                    </Button>
                </Box>
            </DialogActions>
        </Dialog>
    );
}

// ── Delete confirmation dialog ────────────────────────────────────────────────

function DeleteDialog({ open, unit, onClose, onDeleted }) {
    const [deleting, setDeleting] = useState(false);

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await api.delete(`/units/${unit.id}`);
            onDeleted(unit.id);
            onClose();
        } catch {}
        finally { setDeleting(false); }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
            <DialogTitle sx={{ fontWeight: 700 }}>Delete Unit?</DialogTitle>
            <DialogContent>
                <Typography variant="body2" color="text.secondary">
                    Are you sure you want to delete <strong>Unit {unit?.unit_number}</strong>?
                    {unit?.owner && ' The linked owner account will also be removed.'}
                    {' '}This action cannot be undone.
                </Typography>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button onClick={onClose} disabled={deleting}>Cancel</Button>
                <Button variant="contained" color="error" onClick={handleDelete} disabled={deleting}
                    startIcon={deleting && <CircularProgress size={14} color="inherit" />}>
                    {deleting ? 'Deleting…' : 'Delete'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function UnitOwnersPage() {
    const [units,   setUnits]   = useState([]);
    const [loading, setLoading] = useState(true);
    const [search,  setSearch]  = useState('');
    const [toast,   setToast]   = useState(null);

    const [unitDialog,    setUnitDialog]    = useState({ open: false, unit: null });
    const [accountDialog, setAccountDialog] = useState({ open: false, unit: null });
    const [deleteDialog,  setDeleteDialog]  = useState({ open: false, unit: null });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/units?all=1');
            setUnits(res.data.data);
        } catch {}
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleUnitSaved = (saved, isEdit) => {
        setUnits((prev) =>
            isEdit
                ? prev.map((u) => (u.id === saved.id ? { ...u, ...saved } : u))
                : [...prev, { ...saved, owner: null }]
        );
        setToast({ severity: 'success', message: isEdit ? 'Unit updated.' : 'Unit added.' });
    };

    const handleAccountSaved = (unitId, owner) => {
        setUnits((prev) => prev.map((u) => (u.id === unitId ? { ...u, owner } : u)));
        setToast({ severity: 'success', message: owner ? 'Account saved.' : 'Account removed.' });
    };

    const handleDeleted = (unitId) => {
        setUnits((prev) => prev.filter((u) => u.id !== unitId));
        setToast({ severity: 'success', message: 'Unit deleted.' });
    };

    const filtered = units.filter((u) => {
        const q = search.toLowerCase();
        return (
            u.unit_number.toLowerCase().includes(q) ||
            u.owner_name.toLowerCase().includes(q) ||
            (u.owner?.email || '').toLowerCase().includes(q)
        );
    });

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
            <TopBar />

            <Box sx={{ flex: 1, overflow: 'auto', bgcolor: '#f0f4f9', p: 3 }}>
                {/* Page header */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
                    <Box>
                        <Typography variant="h6" fontWeight={700}>Unit Owners</Typography>
                        <Typography variant="caption" color="text.secondary">
                            Manage units and their login accounts
                        </Typography>
                    </Box>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setUnitDialog({ open: true, unit: null })}
                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                    >
                        Add Unit
                    </Button>
                </Box>

                {/* Search */}
                <Box sx={{ mb: 2 }}>
                    <TextField
                        size="small"
                        placeholder="Search by unit #, owner name, or email…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon fontSize="small" color="action" />
                                </InputAdornment>
                            ),
                        }}
                        sx={{
                            width: 340,
                            '& .MuiOutlinedInput-root': {
                                borderRadius: 2, bgcolor: 'white',
                            },
                        }}
                    />
                </Box>

                {/* Table */}
                <TableContainer component={Paper} elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f8fafc' }}>
                                {['Unit #', 'Floor', 'Building', 'Owner Name', 'Status', 'Login Account', 'Actions'].map((h) => (
                                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', py: 1.5 }}>
                                        {h}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                        <CircularProgress size={28} />
                                    </TableCell>
                                </TableRow>
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                                        <Typography variant="body2" color="text.disabled">
                                            {search ? 'No results match your search.' : 'No units yet. Click "Add Unit" to get started.'}
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : filtered.map((unit) => (
                                <TableRow key={unit.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                                    <TableCell sx={{ fontWeight: 600 }}>{unit.unit_number}</TableCell>
                                    <TableCell>{unit.floor || '—'}</TableCell>
                                    <TableCell>{unit.building || '—'}</TableCell>
                                    <TableCell>{unit.owner_name}</TableCell>
                                    <TableCell><StatusChip status={unit.status} /></TableCell>
                                    <TableCell><AccountChip owner={unit.owner} /></TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <Tooltip title="Edit unit">
                                                <IconButton size="small" onClick={() => setUnitDialog({ open: true, unit })}>
                                                    <EditIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title={unit.owner ? 'Manage login account' : 'Create login account'}>
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setAccountDialog({ open: true, unit })}
                                                    sx={{ color: unit.owner ? 'primary.main' : 'text.secondary' }}
                                                >
                                                    {unit.owner ? <ManageAccountsIcon fontSize="small" /> : <PersonAddIcon fontSize="small" />}
                                                </IconButton>
                                            </Tooltip>
                                            <Tooltip title="Delete unit">
                                                <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, unit })}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Tooltip>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Row count */}
                {!loading && (
                    <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 1.5, textAlign: 'right' }}>
                        {filtered.length} unit{filtered.length !== 1 ? 's' : ''}
                        {search && ` matching "${search}"`}
                    </Typography>
                )}
            </Box>

            {/* Dialogs */}
            <UnitDialog
                open={unitDialog.open}
                unit={unitDialog.unit}
                onClose={() => setUnitDialog({ open: false, unit: null })}
                onSaved={handleUnitSaved}
            />
            <AccountDialog
                open={accountDialog.open}
                unit={accountDialog.unit}
                onClose={() => setAccountDialog({ open: false, unit: null })}
                onSaved={handleAccountSaved}
            />
            <DeleteDialog
                open={deleteDialog.open}
                unit={deleteDialog.unit}
                onClose={() => setDeleteDialog({ open: false, unit: null })}
                onDeleted={handleDeleted}
            />

            {/* Call dialogs stay active on this page too */}
            <IncomingCallDialog />
            <OutgoingCallDialog />

            {/* Toast */}
            <Snackbar
                open={!!toast}
                autoHideDuration={3000}
                onClose={() => setToast(null)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                {toast && (
                    <Alert severity={toast.severity} onClose={() => setToast(null)} sx={{ borderRadius: 2 }}>
                        {toast.message}
                    </Alert>
                )}
            </Snackbar>
        </Box>
    );
}
