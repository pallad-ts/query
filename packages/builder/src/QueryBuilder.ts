import {Builder} from "@pallad/builder";
import {SchemaValidation, Validation, ValidatorError, ViolationsList} from "alpha-validator";
import * as yup from 'yup';
import {createSortableFieldSchema} from "./createSortableFieldSchema";
import {byYup} from "alpha-validator-bridge-yup";
import {QueryConfig} from "./QueryConfig";
import {List, Maybe} from "monet";

function concatSchema(schema: yup.ObjectSchema<any>, anotherSchema: yup.ObjectSchema<any>) {
	return schema.concat(anotherSchema);
}

export class QueryBuilder<T extends QueryConfig<any, any>> extends Builder {
	private filtersSchemaObject = yup.object()
		.default({})

	private validation?: (data: unknown) => Promise<Validation<ViolationsList, T['query']>>;

	constructor(readonly config: T) {
		super();
	}

	private getPaginationSchema(): Maybe<yup.ObjectSchema<any>> {
		return Maybe.fromUndefined(
			this.config.getPagination()
		)
			.map(x => {
				if (x.type === 'byCursor') {
					return yup.object().shape({
						limit: this.getLimitSchema(x),
						after: yup.string(),
						before: yup.string()
					});
				}
				return yup.object().shape({
					limit: this.getLimitSchema(x),
					offset: yup.number()
						.integer()
						.min(0)
						.default(0)
				});
			});
	}

	private getLimitSchema(paginationConfig: QueryConfig.Pagination) {
		return yup.number()
			.min(1)
			.max(paginationConfig.maxLimit)
			.integer()
			.default(paginationConfig.defaultLimit);
	}

	filtersSchema(schema: yup.ObjectSchema<any>) {
		this.validation = undefined;
		this.filtersSchemaObject = schema.clone().default({});
		return this;
	}

	private getSortingSchema(): Maybe<yup.ObjectSchema<any>> {
		return Maybe.fromUndefined(
			this.config.getSorting()
		).map(x => {
			const sortByType = createSortableFieldSchema(x.sortableFields.slice());
			if (x.type === 'single') {
				return yup.object().shape({
					sortBy: sortByType.default(x.defaultSorting)
				});
			}

			return yup.object().shape({
				sortBy: yup.array()
					.of(sortByType)
					.min(1)
					.default(x.defaultSorting)
			});
		});
	}

	build(input: unknown): Promise<Validation<ViolationsList, T['query']>> {
		return this.getValidationFunction()(input);
	}

	async buildOrFail(input: unknown, errorMessage?: string) {
		const result = await this.build(input);
		if (result.isFail()) {
			throw new ValidatorError(result.fail(), errorMessage || 'Invalid query');
		}
		return result.success();
	}

	private getValidationFunction() {
		if (!this.validation) {
			let schema = yup.object()
				.shape({
					filters: this.filtersSchemaObject
				})
				.noUnknown();

			schema = this.getPaginationSchema().foldLeft(schema)(concatSchema);
			schema = this.getSortingSchema().foldLeft(schema)(concatSchema)

			this.validation = SchemaValidation.toValidationFunction<unknown, T['query'], undefined>(
				'query builder',
				byYup<unknown, T['query']>(schema)
			) as (data: unknown) => Promise<Validation<ViolationsList, T['query']>>;
		}
		return this.validation;
	}
}


export namespace QueryBuilder {

}
