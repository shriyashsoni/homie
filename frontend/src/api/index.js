// API layer backed by Convex. Method names + the axios-style response shape
// ({ data: { data } }) are preserved so pages work unchanged.
import { api, q, m, qPublic } from './convex';

const ok = () => Promise.resolve({ data: { data: { ok: true } } });

export const profileApi = {
  get:            ()        => q(api.profiles.get),
  update:         (data)    => m(api.profiles.update, { patch: data }),
  publish:        ()        => m(api.profiles.publish),
  unpublish:      ()        => m(api.profiles.update, { patch: { status: 'DRAFT' } }),
  getById:        (id)      => qPublic(api.profiles.getById, { id }),
  saveQuizAnswer: (data)    => m(api.profiles.saveQuiz, data),
};

export const listingApi = {
  list:       (params) => qPublic(api.listings.list, params || {}),
  getById:    (id)     => qPublic(api.listings.getById, { id }),
  create:     (data)   => m(api.listings.create, { data }),
  update:     (id, d)  => m(api.listings.update, { id, patch: d }),
  delete:     (id)     => m(api.listings.setStatus, { id, status: 'DELETED' }),
  mine:       ()       => q(api.listings.mine),
  confirm:    (id)     => m(api.listings.confirmFresh, { id }),
  pause:      (id)     => m(api.listings.setStatus, { id, status: 'PAUSED' }),
  markFilled: (id)     => m(api.listings.setStatus, { id, status: 'FILLED' }),
  save:       (id)     => m(api.listings.save, { id }),
  unsave:     (id)     => m(api.listings.save, { id }),
};

export const connectionApi = {
  list:    ()     => q(api.connections.list),
  send:    (data) => m(api.connections.send, data),
  accept:  (id)   => m(api.connections.accept, { id }),
  decline: (id)   => m(api.connections.decline, { id }),
  cancel:  (id)   => m(api.connections.cancel, { id }),
};

export const viewingApi = {
  list:       ()           => q(api.viewings.list),
  request:    (data)       => m(api.viewings.request, data),
  confirm:    (id)         => m(api.viewings.confirm, { id }),
  cancel:     (id, reason) => m(api.viewings.cancel, { id, reason }),
  reschedule: ()           => ok(),
  getSlots:   ()           => Promise.resolve({ data: { data: { slots: [] } } }),
  createSlot: (data)       => m(api.viewings.addSlot, data),
};

export const matchApi = {
  getMatches: (params) => q(api.matches.list, params || {}),
};

export const conversationApi = {
  list:        ()            => q(api.conversations.list),
  getById:     (id)          => q(api.conversations.getById, { id }),
  sendMessage: (id, content) => m(api.conversations.sendMessage, { id, content }),
};

export const notificationApi = {
  list:        () => q(api.notifications.list),
  markRead:    (id) => m(api.notifications.markRead, { id }),
  markAllRead: () => m(api.notifications.markAllRead),
};

export const reportApi = {
  submit: (data) => m(api.reports.create, data),
};

export const userApi = {
  update:  (data) => m(api.users.updateMe, data),
  delete:  ()     => ok(),
  block:   ()     => ok(),
  unblock: ()     => ok(),
};

export const adminApi = {
  getStats:       ()        => q(api.admin.getStats),
  getUsers:       (params)  => q(api.admin.getUsers, params || {}),
  getUser:        ()        => ok(),
  updateUser:     (id, d)   => m(api.admin.updateUser, { userId: id, ...d }),
  deactivateUser: (id)      => m(api.admin.setUserActive, { userId: id, isActive: false }),
  activateUser:   (id)      => m(api.admin.setUserActive, { userId: id, isActive: true }),
  getListings:    (params)  => q(api.admin.getListings, params || {}),
  updateListing:  (id, d)   => m(api.admin.updateListing, { id, status: d.status }),
  getReports:     (params)  => q(api.admin.getReports, params || {}),
  updateReport:   (id, d)   => m(api.admin.updateReport, { id, ...d }),
  getAnalytics:   ()        => Promise.resolve({ data: { data: { events: [] } } }),
};

export { authApi } from './auth.api';
