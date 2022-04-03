import {Engine} from "@src/Engine";
import {Query as _Query} from "@pallad/query";
import {assert, IsExact} from "conditional-type-checks";

describe('Engine', () => {
	class Entity {
		readonly id!: string;
	}

	interface Filters {
		foo: 'foo';
		bar: 'bar';
	}

	interface Context {
		zee: 'zee',
		query: Query
	}

	type Query = _Query<Filters>;

	describe('types', () => {
		const engine = Engine.create<Entity, Query>(query => {
			return {zee: 'zee', query};
		});

		type Expected = Engine<Entity, Query, Context>;
		assert<IsExact<typeof engine, Expected>>(true);
	});
})
