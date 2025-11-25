/**
 * Base Repository Class with robust error handling
 */
const DatabaseError = require('../errors/databaseError');

class BaseRepository {
    constructor(model) {
        this.model = model;
    }

    // Helper to wrap DB operations
    async _execute(operation) {
        try {
            return await operation();
        } catch (err) {
            // Wrap and rethrow as DatabaseError
            throw new DatabaseError(err.message);
        }
    }

    async create(data, options = {}) {
        return this._execute(() => this.model.create([data], options).then(docs => docs[0]));
    }

    async findById(id, populateOptions = {}) {
        return this._execute(() => {
            let query = this.model.findById(id);
            if (populateOptions.populate) {
                populateOptions.populate.forEach(pop => {
                    query = query.populate(pop.path, pop.select);
                });
            }
            return query;
        });
    }

    async findOne(criteria, populateOptions = {}) {
        return this._execute(() => {
            let query = this.model.findOne(criteria);
            if (populateOptions.populate) {
                populateOptions.populate.forEach(pop => {
                    query = query.populate(pop.path, pop.select);
                });
            }
            return query;
        });
    }

    async find(criteria = {}, options = {}) {
        return this._execute(() => {
            let query = this.model.find(criteria);
            if (options.populate) {
                options.populate.forEach(pop => {
                    query = query.populate(pop.path, pop.select);
                });
            }
            if (options.sort) query = query.sort(options.sort);
            if (options.limit) query = query.limit(options.limit);
            if (options.skip) query = query.skip(options.skip);
            return query;
        });
    }

    async update(id, data, options = { new: true }) {
        return this._execute(() => this.model.findByIdAndUpdate(id, data, options));
    }

    async updateOne(criteria, data, options = { new: true }) {
        return this._execute(() => this.model.findOneAndUpdate(criteria, data, options));
    }

    async updateMany(criteria, data) {
        return this._execute(() => this.model.updateMany(criteria, data));
    }

    async delete(id, options = {}) {
        return this._execute(() => this.model.findByIdAndDelete(id, options));
    }

    async deleteOne(criteria) {
        return this._execute(() => this.model.findOneAndDelete(criteria));
    }

    async deleteMany(criteria) {
        return this._execute(() => this.model.deleteMany(criteria));
    }

    async count(criteria = {}) {
        return this._execute(() => this.model.countDocuments(criteria));
    }

    async exists(criteria) {
        return this._execute(async () => {
            const count = await this.model.countDocuments(criteria);
            return count > 0;
        });
    }
}

module.exports = BaseRepository;
