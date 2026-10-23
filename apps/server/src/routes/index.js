const { Router } = require('express');
const authRoutes = require('./auth.routes');
const sidebarRoutes = require('./sidebar.routes');
const headerRoutes = require('./header.routes');
const editorRoutes = require('./editor.routes');
const graphRoutes = require('./graph.routes');
const propertiesRoutes = require('./document-properties.routes');

const router = Router();

router.use('/auth', authRoutes);
router.use('/sidebar', sidebarRoutes);
router.use('/header', headerRoutes);
router.use('/editor', editorRoutes);
router.use('/graph', graphRoutes);
router.use('/document-properties', propertiesRoutes);

module.exports = router;
