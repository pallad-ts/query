import {Builder} from "@pallad/builder";
import {Either, SchemaValidation, ValidatorError, ViolationsList} from "alpha-validator";
import * as yup from 'yup';
import {createSortableFieldSchema} from "./createSortableFieldSchema";
import {byYup} from "alpha-validator-bridge-yup";
import {QueryConfig} from "./QueryConfig";
import {fromNullable, Maybe} from "@sweet-monads/maybe";

function concatSchema(schema: yup.ObjectSchema<any>, anotherSchema: Maybe<yup.ObjectSchema<any>>) {
	if (anotherSchema.isJust()) {
		return schema.concat(anotherSchema.value);
	}
	return schema;
}

export class QueryBuilder<T extends QueryConfig<any, any>> extends Builder {
	private filtersSchemaObject = yup.object()
		.default({})

	private validation?: (data: unknown) => Promise<Either<ViolationsList, T['query']>>;

	constructor(readonly config: T) {
		super();
	}

	private getPaginationSchema(): Maybe<yup.ObjectSchema<any>> {
		return fromNullable(
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
		return fromNullable(
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

	build(input: unknown): Promise<Either<ViolationsList, T['query']>> {
		return this.getValidationFunction()(input);
	}

	async buildOrFail(input: unknown, errorMessage?: string) {
		const result = await this.build(input);
		if (result.isLeft()) {
			throw new ValidatorError(result.value, errorMessage || 'Invalid query');
		}
		return result.value;
	}

	private getValidationFunction() {
		if (!this.validation) {
			let schema = yup.object()
				.shape({
					filters: this.filtersSchemaObject
				})
				.noUnknown();

			schema = concatSchema(schema, this.getPaginationSchema());
			schema = concatSchema(schema, this.getSortingSchema());

			this.validation = SchemaValidation.toValidationFunction<unknown, T['query'], undefined>(
				'query builder',
				byYup<unknown, T['query']>(schema)
			) as (data: unknown) => Promise<Either<ViolationsList, T['query']>>;
		}
		return this.validation;
	}
}

export namespace QueryBuilder {

}
