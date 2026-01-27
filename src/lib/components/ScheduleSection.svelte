<script>
	import ScheduleTimeline from './ScheduleTimeline.svelte';
	import { fly, fade } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	// Direct imports to avoid SSR issues
	import Calendar from 'lucide-svelte/icons/calendar';
	import MapPin from 'lucide-svelte/icons/map-pin';
	import ChevronDown from 'lucide-svelte/icons/chevron-down';
	import Rocket from 'lucide-svelte/icons/rocket';
	import Clock from 'lucide-svelte/icons/clock';

	/**
	 * @type {{
	 *   scheduleData: {
	 *     nextUp: any;
	 *     monthlyEvents: Array<{
	 *       month: string;
	 *       label: string;
	 *       events: any[];
	 *     }>;
	 *   };
	 *   pastEventsByMonth: Array<any>;
	 * }}
	 */
	let { scheduleData, pastEventsByMonth } = $props();

	/**
	 * @param {string} dateStr
	 */
	function formatDate(dateStr) {
		if (!dateStr) return 'TBD';
		const date = new Date(dateStr);
		return date.toLocaleDateString('ja-JP', {
			month: 'short',
			day: 'numeric',
			weekday: 'short'
		});
	}

	/**
	 * @param {string} dateStr
	 */
	function getDaysUntil(dateStr) {
		if (!dateStr) return null;
		const today = new Date();
		today.setHours(0, 0, 0, 0);
		const eventDate = new Date(dateStr);
		eventDate.setHours(0, 0, 0, 0);
		const diff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
		return diff;
	}

	// Helper for pastel dots
	/**
	 * @param {string} type
	 */
	function getStatusColor(type) {
		if (type?.includes('ハッカソン')) return 'bg-purple-400';
		if (type?.includes('イベント')) return 'bg-blue-400';
		if (type?.includes('合宿')) return 'bg-green-400';
		if (type?.includes('MTG')) return 'bg-yellow-400';
		return 'bg-gray-400';
	}
</script>

<section id="schedule" class="py-24">
	<div class="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
		<div class="mb-16 text-center relative">
			<span
				class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[6rem] sm:text-[8rem] md:text-[10rem] font-bold text-gray-200/60 -z-10 select-none pointer-events-none leading-none tracking-tighter"
				style="font-family: 'Inter', sans-serif;">SCHEDULE</span
			>
			<h2
				class="mb-4 text-4xl font-semibold tracking-tight md:text-5xl"
				style="color: #1D1D1F;"
				in:fly={{ y: 30, duration: 600, easing: cubicOut }}
			>
				Schedule
			</h2>
			<p
				class="text-lg relative z-10"
				style="color: #6B6B6B;"
				in:fly={{ y: 30, delay: 100, duration: 600, easing: cubicOut }}
			>
				今後の活動予定と記録
			</p>
		</div>

		<div class="space-y-16">
			<!-- 1. Next Up Section (Glassmorphism Hero) -->
			{#if scheduleData.nextUp}
				{@const event = scheduleData.nextUp}
				{@const daysUntil = getDaysUntil(event.date)}
				<div class="space-y-6">
					<h3 class="flex items-center gap-2 text-xl font-semibold text-gray-800 pl-4">
						<Rocket class="h-5 w-5 text-blue-500" />
						Next Up
					</h3>

					<div
						class="relative overflow-hidden rounded-[32px] p-8 transition-transform hover:scale-[1.01]"
						style="background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.5); box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1);"
						in:fly={{ y: 30, duration: 600, easing: cubicOut }}
					>
						<!-- Background Gradient Decoration -->
						<div
							class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-100 opacity-40 blur-3xl"
						></div>
						<div
							class="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-purple-100 opacity-40 blur-3xl"
						></div>

						<div class="relative z-10 flex flex-col md:flex-row md:items-center md:gap-12">
							<!-- Date & Count -->
							<div class="flex shrink-0 flex-col items-center md:items-start">
								<span class="text-sm font-medium uppercase tracking-wider text-gray-500">
									{new Date(event.date).getFullYear()}
								</span>
								<div class="flex items-baseline gap-1">
									<span class="text-5xl font-bold text-gray-900">
										{new Date(event.date).getDate()}
									</span>
									<span class="text-xl font-medium text-gray-600">
										{new Date(event.date).toLocaleDateString('en-US', { month: 'short' })}
									</span>
								</div>
								{#if daysUntil !== null && daysUntil >= 0}
									<div
										class="mt-2 rounded-full bg-blue-100/80 px-3 py-1 text-xs font-bold text-blue-600 backdrop-blur-sm"
									>
										{#if daysUntil === 0}
											TODAY
										{:else}
											あと{daysUntil}日
										{/if}
									</div>
								{/if}
							</div>

							<!-- Content -->
							<div class="mt-6 flex-1 text-center md:mt-0 md:text-left">
								<h4 class="mb-3 text-2xl font-bold text-gray-900">{event.title}</h4>
								<div
									class="flex flex-wrap items-center justify-center gap-4 text-gray-600 md:justify-start"
								>
									{#if event.location}
										<span class="flex items-center gap-1 text-sm">
											<MapPin class="h-4 w-4 text-gray-400" />
											{event.location}
										</span>
									{/if}
									{#if event.description}
										<span
											class="rounded-full border border-gray-200 bg-white/50 px-3 py-1 text-xs backdrop-blur-sm"
										>
											{event.description}
										</span>
									{/if}
								</div>
							</div>
						</div>
					</div>
				</div>
			{/if}

			<!-- 2. Future Plans (Timeline) -->
			{#if scheduleData.monthlyEvents.length > 0}
				<div class="relative space-y-8 pl-4 sm:pl-8">
					<!-- Timeline Line -->
					<div
						class="absolute left-[1.65rem] top-4 bottom-12 w-[2px] rounded-full"
						style="background: linear-gradient(to bottom, #93C5FD 0%, #C4B5FD 50%, #F9A8D4 100%); opacity: 0.6;"
					></div>

					<div class="space-y-12">
						{#each scheduleData.monthlyEvents as group}
							<div class="relative">
								<!-- Month Header Node -->
								<div class="flex items-center gap-4 mb-6">
									<div
										class="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white shadow-md border border-white/50"
										style="backdrop-filter: blur(8px);"
									>
										<span class="text-xs font-bold text-gray-800">{group.label}</span>
									</div>
									<h3 class="text-lg font-bold text-gray-700 opacity-60">
										{group.month.replace('-', '.')}
									</h3>
								</div>

								<!-- Events -->
								<div class="space-y-6 pl-[4.5rem]">
									{#each group.events as event, i}
										<div
											class="relative group"
											in:fly={{ y: 20, delay: i * 50, duration: 500, easing: cubicOut }}
										>
											<!-- Timeline Connector -->
											<div
												class="absolute -left-[3.7rem] top-6 h-3 w-3 rounded-full border-2 border-white shadow-sm transition-transform group-hover:scale-125 {getStatusColor(
													event.description
												)}"
											></div>

											<div
												class="overflow-hidden rounded-2xl p-6 transition-all hover:-translate-y-1 hover:shadow-lg"
												style="background: rgba(255, 255, 255, 0.6); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.5);"
											>
												<div class="flex items-start gap-4">
													<div class="flex-1">
														<div class="flex flex-wrap items-baseline justify-between gap-x-4">
															<h5 class="text-lg font-bold text-gray-900 leading-tight">
																{event.title}
															</h5>
															<span class="font-medium text-gray-500 text-sm">
																{formatDate(event.date)}
															</span>
														</div>

														{#if !event.description && !event.location}
															<p class="mt-2 text-sm italic text-gray-400">Coming Soon...</p>
														{:else}
															<div class="mt-3 flex flex-wrap gap-3 text-sm text-gray-500">
																{#if event.location}
																	<span class="flex items-center gap-1">
																		<MapPin class="h-3 w-3" />
																		{event.location}
																	</span>
																{/if}
																{#if event.description}
																	<span
																		class="px-2 py-0.5 rounded-md bg-white/50 border border-black/5"
																		>{event.description}</span
																	>
																{/if}
															</div>
														{/if}
													</div>
												</div>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- 3. Past Events (Archive) -->
			<div
				class="pt-12 border-t border-gray-200/50 opacity-60 hover:opacity-100 transition-opacity duration-500"
			>
				<h3 class="mb-8 text-center text-lg font-medium text-gray-500/80">Archive (History)</h3>
				<ScheduleTimeline monthGroups={pastEventsByMonth} />
			</div>
		</div>
	</div>
</section>
