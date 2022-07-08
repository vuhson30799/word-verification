import * as React from 'react';
import {alpha, styled} from '@mui/material/styles';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import InputBase from '@mui/material/InputBase';
import MenuItem from '@mui/material/MenuItem';
import MailIcon from '@mui/icons-material/Mail';
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Drawer from "@mui/material/Drawer";
import {AccountCircle} from '@mui/icons-material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SearchIcon from '@mui/icons-material/Search';
import Badge from '@mui/material/Badge';
import {Menu} from '@mui/material';
import MuiAppBar, {AppBarProps as MuiAppBarProps} from '@mui/material/AppBar';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import ViewListIcon from '@mui/icons-material/ViewList';
import BugReportIcon from '@mui/icons-material/BugReport';
import Link from 'next/link';
import styles from '../styles/MySearchAppBar.module.css'

const Search = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: alpha(theme.palette.common.white, 0.15),
    '&:hover': {
        backgroundColor: alpha(theme.palette.common.white, 0.25),
    },
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
        marginLeft: theme.spacing(3),
        width: 'auto',
    },
}));

const SearchIconWrapper = styled('div')(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
}));

const StyledInputBase = styled(InputBase)(({ theme }) => ({
    color: 'inherit',
    '& .MuiInputBase-input': {
        padding: theme.spacing(1, 1, 1, 0),
        // vertical padding + font size from searchIcon
        paddingLeft: `calc(1em + ${theme.spacing(4)})`,
        transition: theme.transitions.create('width'),
        width: '100%',
        [theme.breakpoints.up('md')]: {
            width: '20ch',
        },
    },
}));

const drawerWidth = 240;

interface AppBarProps extends MuiAppBarProps {
    open?: boolean;
}

const AppBar = styled(MuiAppBar, {
    shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
    transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
    }),
    ...(open && {
        width: `calc(100% - ${drawerWidth}px)`,
        marginLeft: `${drawerWidth}px`,
        transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.easeOut,
            duration: theme.transitions.duration.enteringScreen,
        }),
    }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
    display: 'flex',
    alignItems: 'center',
    padding: theme.spacing(0, 1),
    // necessary for content to be below app bar
    ...theme.mixins.toolbar,
    justifyContent: 'flex-end',
}));

export default function MySearchAppBar() {
    const [open, setOpen] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

    const handleDrawerOpen = () => {
        setOpen(true);
    };

    const handleDrawerClose = () => {
        setOpen(false);
    }

    const isMenuOpen = Boolean(anchorEl);

    const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const menuId = 'primary-search-account-menu';
    const renderMenu = (
        <Menu
            anchorEl={anchorEl}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            id={menuId}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            open={isMenuOpen}
            onClose={handleMenuClose}
        >
            <MenuItem onClick={handleMenuClose}>Profile</MenuItem>
            <MenuItem onClick={handleMenuClose}>My account</MenuItem>
        </Menu>
    );

    return (
        <Box>
            <AppBar className={styles.Header} position="fixed" open={open}>
                <Toolbar>
                    <IconButton color="inherit" aria-label="open drawer" onClick={handleDrawerOpen} edge="start" sx={{ mr: 2, ...(open && { display: 'none' }) }}>
                        <MenuIcon />
                    </IconButton>
                    <Typography className={styles.LogoTypography} variant="h6" noWrap component="div">
                        <Link href="/admin/dashboard" >
                            <div className={styles.Logo}>Word Verification</div>
                        </Link>
                    </Typography>
                    <Search sx={{ display: { xs: 'none', md: 'flex' } }}>
                        <SearchIconWrapper>
                            <SearchIcon />
                        </SearchIconWrapper>
                        <StyledInputBase placeholder="Search…" inputProps={{ 'aria-label': 'search' }}/>
                    </Search>
                    <Box sx={{ flexGrow: 1 }} />
                    <Box sx={{ display: { xs: 'none', md: 'flex' } }}>
                        <IconButton size="large" aria-label="show 4 new mails" color="inherit">
                            <Badge badgeContent={4} color="error">
                                <MailIcon />
                            </Badge>
                        </IconButton>
                        <IconButton size="large" aria-label="show 17 new notifications" color="inherit">
                            <Badge badgeContent={17} color="error">
                                <NotificationsIcon />
                            </Badge>
                        </IconButton>
                        <IconButton size="large" edge="end" aria-label="account of current user" aria-controls={menuId} aria-haspopup="true" onClick={handleProfileMenuOpen} color="inherit">
                            <AccountCircle />
                        </IconButton>
                    </Box>
                </Toolbar>
            </AppBar>
            {open &&
                <>
                    <Drawer
                        sx={{
                            width: drawerWidth,
                            flexShrink: 0,
                            '& .MuiDrawer-paper': {
                                width: drawerWidth,
                                boxSizing: 'border-box',
                            },
                        }}
                        variant="persistent"
                        anchor="left"
                        open={true}
                    >
                        <DrawerHeader>
                            <IconButton onClick={handleDrawerClose}>
                                <ChevronLeftIcon />
                            </IconButton>
                        </DrawerHeader>
                        <Divider />
                        <List>
                            <Link href="/admin/quiz">
                                <ListItem button >
                                    <ListItemIcon>
                                        <AddCircleOutlineIcon/>
                                    </ListItemIcon>
                                    <ListItemText primary="Create"/>
                                </ListItem>
                            </Link>
                            <Link href="/admin/examination">
                                <ListItem button >
                                    <ListItemIcon>
                                        <ViewListIcon/>
                                    </ListItemIcon>
                                    <ListItemText primary="Examinations"/>
                                </ListItem>
                            </Link>
                            <Link href="/admin/utils/arrange-wrong-answers">
                                <ListItem button >
                                    <ListItemIcon>
                                        <BugReportIcon/>
                                    </ListItemIcon>
                                    <ListItemText primary="Arrange wrong answers"/>
                                </ListItem>
                            </Link>
                        </List>
                        <Divider />
                    </Drawer>
                    {renderMenu}
                </>
            }
        </Box>
    );
}
