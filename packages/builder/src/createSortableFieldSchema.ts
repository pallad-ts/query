import * as yup from 'yup';

export function createSortableFieldSchema(allowedFields: string[]) {
	return yup.object()
		.shape({
			field: yup.string()
				.oneOf(allowedFields)
				.required(),
			direction: yup.string()
				.oneOf(['DESC', 'ASC'])
				.required()
		})
		.noUnknown();
}
