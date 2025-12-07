import { httpSuccess, httpError } from '../../common/utils/http.js';
import Product from '../treatments/product.model.js';
import BiologicalMethod from '../treatments/biologicalMethod.model.js';
import CulturalPractice from '../treatments/culturalPractice.model.js';

/**
 * Get all products with pagination
 * @route GET /api/v1/admin/data/products
 */
export const getProductsController = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', verified } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { activeIngredient: { $regex: search, $options: 'i' } },
        { manufacturer: { $regex: search, $options: 'i' } },
      ];
    }
    if (verified !== undefined) {
      query.verified = verified === 'true';
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Product.countDocuments(query),
    ]);

    const { statusCode, body } = httpSuccess(200, 'Products retrieved successfully', {
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new product
 * @route POST /api/v1/admin/data/products
 */
export const createProductController = async (req, res, next) => {
  try {
    const product = new Product(req.body);
    await product.save();

    const { statusCode, body } = httpSuccess(201, 'Product created successfully', product);
    res.status(statusCode).json(body);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return next(httpError(400, error.message));
    }
    next(error);
  }
};

/**
 * Update a product
 * @route PUT /api/v1/admin/data/products/:id
 */
export const updateProductController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      return next(httpError(404, 'Product not found'));
    }

    const { statusCode, body } = httpSuccess(200, 'Product updated successfully', product);
    res.status(statusCode).json(body);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return next(httpError(400, error.message));
    }
    next(error);
  }
};

/**
 * Delete a product
 * @route DELETE /api/v1/admin/data/products/:id
 */
export const deleteProductController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return next(httpError(404, 'Product not found'));
    }

    const { statusCode, body } = httpSuccess(200, 'Product deleted successfully', { id });
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all biological methods with pagination
 * @route GET /api/v1/admin/data/biological-methods
 */
export const getBiologicalMethodsController = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', verified } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { materials: { $regex: search, $options: 'i' } },
      ];
    }
    if (verified !== undefined) {
      query.verified = verified === 'true';
    }

    const [methods, total] = await Promise.all([
      BiologicalMethod.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      BiologicalMethod.countDocuments(query),
    ]);

    const { statusCode, body } = httpSuccess(200, 'Biological methods retrieved successfully', {
      methods,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new biological method
 * @route POST /api/v1/admin/data/biological-methods
 */
export const createBiologicalMethodController = async (req, res, next) => {
  try {
    const method = new BiologicalMethod(req.body);
    await method.save();

    const { statusCode, body } = httpSuccess(201, 'Biological method created successfully', method);
    res.status(statusCode).json(body);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return next(httpError(400, error.message));
    }
    next(error);
  }
};

/**
 * Update a biological method
 * @route PUT /api/v1/admin/data/biological-methods/:id
 */
export const updateBiologicalMethodController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const method = await BiologicalMethod.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!method) {
      return next(httpError(404, 'Biological method not found'));
    }

    const { statusCode, body } = httpSuccess(200, 'Biological method updated successfully', method);
    res.status(statusCode).json(body);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return next(httpError(400, error.message));
    }
    next(error);
  }
};

/**
 * Delete a biological method
 * @route DELETE /api/v1/admin/data/biological-methods/:id
 */
export const deleteBiologicalMethodController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const method = await BiologicalMethod.findByIdAndDelete(id);

    if (!method) {
      return next(httpError(404, 'Biological method not found'));
    }

    const { statusCode, body } = httpSuccess(200, 'Biological method deleted successfully', { id });
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Get all cultural practices with pagination
 * @route GET /api/v1/admin/data/cultural-practices
 */
export const getCulturalPracticesController = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, search = '', category, verified } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const query = {};
    if (search) {
      query.$or = [
        { action: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (category) {
      query.category = category;
    }
    if (verified !== undefined) {
      query.verified = verified === 'true';
    }

    const [practices, total] = await Promise.all([
      CulturalPractice.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      CulturalPractice.countDocuments(query),
    ]);

    const { statusCode, body } = httpSuccess(200, 'Cultural practices retrieved successfully', {
      practices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new cultural practice
 * @route POST /api/v1/admin/data/cultural-practices
 */
export const createCulturalPracticeController = async (req, res, next) => {
  try {
    const practice = new CulturalPractice(req.body);
    await practice.save();

    const { statusCode, body } = httpSuccess(201, 'Cultural practice created successfully', practice);
    res.status(statusCode).json(body);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return next(httpError(400, error.message));
    }
    next(error);
  }
};

/**
 * Update a cultural practice
 * @route PUT /api/v1/admin/data/cultural-practices/:id
 */
export const updateCulturalPracticeController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const practice = await CulturalPractice.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!practice) {
      return next(httpError(404, 'Cultural practice not found'));
    }

    const { statusCode, body } = httpSuccess(200, 'Cultural practice updated successfully', practice);
    res.status(statusCode).json(body);
  } catch (error) {
    if (error.name === 'ValidationError') {
      return next(httpError(400, error.message));
    }
    next(error);
  }
};

/**
 * Delete a cultural practice
 * @route DELETE /api/v1/admin/data/cultural-practices/:id
 */
export const deleteCulturalPracticeController = async (req, res, next) => {
  try {
    const { id } = req.params;
    const practice = await CulturalPractice.findByIdAndDelete(id);

    if (!practice) {
      return next(httpError(404, 'Cultural practice not found'));
    }

    const { statusCode, body } = httpSuccess(200, 'Cultural practice deleted successfully', { id });
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

/**
 * Get statistics for all data types
 * @route GET /api/v1/admin/data/stats
 */
export const getDataStatsController = async (req, res, next) => {
  try {
    const [productsCount, bioMethodsCount, culturalCount, verifiedProducts, verifiedBio, verifiedCultural] = await Promise.all([
      Product.countDocuments(),
      BiologicalMethod.countDocuments(),
      CulturalPractice.countDocuments(),
      Product.countDocuments({ verified: true }),
      BiologicalMethod.countDocuments({ verified: true }),
      CulturalPractice.countDocuments({ verified: true }),
    ]);

    const { statusCode, body } = httpSuccess(200, 'Data statistics retrieved successfully', {
      products: {
        total: productsCount,
        verified: verifiedProducts,
        unverified: productsCount - verifiedProducts,
      },
      biologicalMethods: {
        total: bioMethodsCount,
        verified: verifiedBio,
        unverified: bioMethodsCount - verifiedBio,
      },
      culturalPractices: {
        total: culturalCount,
        verified: verifiedCultural,
        unverified: culturalCount - verifiedCultural,
      },
      total: productsCount + bioMethodsCount + culturalCount,
    });
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
};

